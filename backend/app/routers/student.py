import datetime
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import (
    User, Module, Lesson, LessonProgress, Test, Question,
    TestAttempt, CodeTask, CodeAttempt, ChatMessage, Feedback, UserBadge,
    DirectMessage, GroupMessage,
)
from app.schemas.schemas import (
    UserProfile, ModuleOut, LessonOut, ProgressOut, MarkCompleteRequest,
    TestOut, TestSubmit, TestAttemptOut, CodeTaskOut, CodeSubmit,
    CodeAttemptOut, ChatSend, ChatMessageOut, FeedbackOut, BadgeOut,
    DirectMessageSend, GroupMessageSend,
)
from app.utils.auth import get_current_user, require_role
from app.utils.badges import check_and_award_badges
from app.utils.ai_helper import generate_response

router = APIRouter(prefix="/api/student", tags=["student"])


def _student(user: User = Depends(get_current_user)):
    if user.role != "student":
        raise HTTPException(403, "Students only")
    return user


# ── Profile ────────────────────────────────────────────

@router.get("/profile", response_model=UserProfile)
def profile(user: User = Depends(_student), db: Session = Depends(get_db)):
    total = db.query(Lesson).count()
    completed = db.query(LessonProgress).filter(
        LessonProgress.user_id == user.id, LessonProgress.completed == True
    ).count()
    progress_pct = (completed / total * 100) if total else 0

    badges = []
    for ub in user.badges:
        badges.append({
            "key": ub.badge.key, "title": ub.badge.title,
            "icon": ub.badge.icon, "description": ub.badge.description,
            "earned_at": ub.earned_at.isoformat() if ub.earned_at else None,
        })

    return UserProfile(
        id=user.id, username=user.username, full_name=user.full_name,
        role=user.role, grade=user.grade, points=user.points,
        level=user.level, streak_days=user.streak_days,
        created_at=user.created_at,
        progress_percent=round(progress_pct, 1),
        completed_lessons=completed, total_lessons=total,
        badges=badges,
    )


# ── Modules & Lessons ─────────────────────────────────

@router.get("/modules")
def list_modules(db: Session = Depends(get_db), user: User = Depends(_student)):
    modules = db.query(Module).order_by(Module.order).all()
    result = []
    for m in modules:
        lessons = []
        for l in m.lessons:
            prog = db.query(LessonProgress).filter(
                LessonProgress.user_id == user.id, LessonProgress.lesson_id == l.id
            ).first()
            lessons.append({
                "id": l.id, "title": l.title, "order": l.order,
                "completed": prog.completed if prog else False,
            })
        result.append({
            "id": m.id, "title": m.title, "order": m.order,
            "description": m.description, "lessons": lessons,
        })
    return result


@router.get("/lessons/{lesson_id}", response_model=LessonOut)
def get_lesson(lesson_id: int, user: User = Depends(_student), db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    # track open
    prog = db.query(LessonProgress).filter(
        LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson_id
    ).first()
    if not prog:
        prog = LessonProgress(user_id=user.id, lesson_id=lesson_id)
        db.add(prog)
    prog.last_opened = datetime.datetime.utcnow()
    db.commit()

    return lesson


@router.post("/lessons/complete")
def complete_lesson(req: MarkCompleteRequest, user: User = Depends(_student), db: Session = Depends(get_db)):
    prog = db.query(LessonProgress).filter(
        LessonProgress.user_id == user.id, LessonProgress.lesson_id == req.lesson_id
    ).first()
    if not prog:
        prog = LessonProgress(user_id=user.id, lesson_id=req.lesson_id)
        db.add(prog)

    if not prog.completed:
        prog.completed = True
        prog.completed_at = datetime.datetime.utcnow()
        user.points += 10
    prog.time_spent_seconds += req.time_spent_seconds
    db.commit()

    new_badges = check_and_award_badges(db, user)
    return {"ok": True, "points": user.points, "new_badges": new_badges}


# ── Tests ──────────────────────────────────────────────

@router.get("/tests")
def list_tests(db: Session = Depends(get_db), user: User = Depends(_student)):
    tests = db.query(Test).all()
    result = []
    for t in tests:
        attempt = db.query(TestAttempt).filter(
            TestAttempt.user_id == user.id, TestAttempt.test_id == t.id
        ).order_by(TestAttempt.completed_at.desc()).first()
        result.append({
            "id": t.id, "title": t.title, "difficulty": t.difficulty,
            "question_count": len(t.questions),
            "best_score": attempt.score if attempt else None,
            "attempted": attempt is not None,
        })
    return result


@router.get("/tests/{test_id}")
def get_test(test_id: int, db: Session = Depends(get_db), user: User = Depends(_student)):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(404, "Test not found")
    questions = []
    for q in test.questions:
        questions.append({
            "id": q.id, "question_type": q.question_type, "text": q.text,
            "options": q.options, "order": q.order,
        })
    return {"id": test.id, "title": test.title, "difficulty": test.difficulty, "questions": questions}


@router.post("/tests/{test_id}/submit", response_model=TestAttemptOut)
def submit_test(test_id: int, req: TestSubmit, user: User = Depends(_student), db: Session = Depends(get_db)):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(404, "Test not found")

    score = 0
    max_score = len(test.questions)
    wrong = []

    for q in test.questions:
        student_answer = req.answers.get(str(q.id))
        if student_answer == q.correct_answer:
            score += 1
        else:
            wrong.append({
                "question_id": q.id, "text": q.text,
                "your_answer": student_answer,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
            })

    points_earned = int(score / max_score * 20) if max_score else 0
    user.points += points_earned

    attempt = TestAttempt(
        user_id=user.id, test_id=test_id,
        score=score, max_score=max_score,
        answers=req.answers, wrong_answers=wrong,
        time_spent_seconds=req.time_spent_seconds,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    check_and_award_badges(db, user)
    return attempt


@router.get("/test-history")
def test_history(user: User = Depends(_student), db: Session = Depends(get_db)):
    attempts = db.query(TestAttempt).filter(TestAttempt.user_id == user.id)\
        .order_by(TestAttempt.completed_at.desc()).all()
    result = []
    for a in attempts:
        test = db.query(Test).filter(Test.id == a.test_id).first()
        result.append({
            "id": a.id, "test_id": a.test_id,
            "test_title": test.title if test else "Unknown",
            "score": a.score, "max_score": a.max_score,
            "time_spent_seconds": a.time_spent_seconds,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            "wrong_answers": a.wrong_answers,
        })
    return result


# ── Code Tasks ─────────────────────────────────────────

@router.get("/tasks")
def list_tasks(db: Session = Depends(get_db), user: User = Depends(_student)):
    tasks = db.query(CodeTask).all()
    result = []
    for t in tasks:
        best = db.query(CodeAttempt).filter(
            CodeAttempt.user_id == user.id, CodeAttempt.task_id == t.id
        ).order_by(CodeAttempt.score.desc()).first()
        result.append({
            "id": t.id, "title": t.title, "difficulty": t.difficulty,
            "description": t.description, "starter_code": t.starter_code,
            "best_score": best.score if best else None,
            "max_score": len(t.test_cases),
        })
    return result


@router.get("/tasks/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(_student)):
    task = db.query(CodeTask).filter(CodeTask.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    return {
        "id": task.id, "title": task.title, "description": task.description,
        "difficulty": task.difficulty, "starter_code": task.starter_code,
        "test_case_count": len(task.test_cases),
    }


@router.post("/tasks/{task_id}/submit", response_model=CodeAttemptOut)
def submit_code(task_id: int, req: CodeSubmit, user: User = Depends(_student), db: Session = Depends(get_db)):
    """Submit code for auto-check. Runs against test cases server-side with sandboxing."""
    task = db.query(CodeTask).filter(CodeTask.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    results = []
    score = 0
    for i, tc in enumerate(task.test_cases):
        passed, output, error = _run_code_safe(req.code, tc.get("input", ""))
        expected = tc.get("expected_output", "").strip()
        actual = output.strip() if output else ""
        is_pass = passed and actual == expected

        if is_pass:
            score += 1

        results.append({
            "case": i + 1,
            "input": tc.get("input", ""),
            "expected": expected,
            "actual": actual,
            "passed": is_pass,
            "error": error,
        })

    points_earned = int(score / len(task.test_cases) * 15) if task.test_cases else 0
    user.points += points_earned

    attempt = CodeAttempt(
        user_id=user.id, task_id=task_id,
        code=req.code, score=score, max_score=len(task.test_cases),
        results=results,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    check_and_award_badges(db, user)
    return attempt


@router.get("/task-history")
def task_history(user: User = Depends(_student), db: Session = Depends(get_db)):
    attempts = db.query(CodeAttempt).filter(CodeAttempt.user_id == user.id)\
        .order_by(CodeAttempt.created_at.desc()).all()
    return [
        {
            "id": a.id, "task_id": a.task_id, "score": a.score,
            "max_score": a.max_score, "results": a.results,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in attempts
    ]


def _run_code_safe(code: str, stdin_input: str) -> tuple:
    """Execute code in a restricted subprocess with timeout."""
    import subprocess, tempfile, os
    # Basic safety checks
    forbidden = ["import os", "import sys", "import subprocess", "import shutil",
                 "open(", "__import__", "eval(", "exec(", "compile("]
    for f in forbidden:
        if f in code:
            return False, "", f"Forbidden operation: {f}"

    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as tmp:
        tmp.write(code)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            ["python3", tmp_path],
            input=stdin_input, capture_output=True, text=True, timeout=5,
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Time limit exceeded (5s)"
    except Exception as e:
        return False, "", str(e)
    finally:
        os.unlink(tmp_path)


# ── Chat / AI ──────────────────────────────────────────

@router.post("/chat")
def chat(req: ChatSend, user: User = Depends(_student), db: Session = Depends(get_db)):
    # Save user message
    user_msg = ChatMessage(user_id=user.id, role="user", content=req.message)
    db.add(user_msg)
    db.flush()

    # Build history for GPT context
    recent = db.query(ChatMessage).filter(ChatMessage.user_id == user.id)\
        .order_by(ChatMessage.created_at.desc()).limit(12).all()
    history = [{"role": m.role, "content": m.content} for m in reversed(recent)]

    # Generate response (GPT if API key set, else rule-based)
    response_text = generate_response(req.message, history=history)
    assistant_msg = ChatMessage(user_id=user.id, role="assistant", content=response_text)
    db.add(assistant_msg)
    db.commit()

    return {"response": response_text, "id": assistant_msg.id}


@router.get("/chat/history")
def chat_history(user: User = Depends(_student), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.user_id == user.id)\
        .order_by(ChatMessage.created_at).all()
    return [
        {"id": m.id, "role": m.role, "content": m.content,
         "created_at": m.created_at.isoformat() if m.created_at else None}
        for m in messages
    ]


# ── Feedback / Inbox ───────────────────────────────────

@router.get("/feedback")
def my_feedback(user: User = Depends(_student), db: Session = Depends(get_db)):
    items = db.query(Feedback).filter(Feedback.student_id == user.id)\
        .order_by(Feedback.created_at.desc()).all()
    result = []
    for f in items:
        teacher = db.query(User).filter(User.id == f.teacher_id).first()
        result.append({
            "id": f.id, "message": f.message, "is_read": f.is_read,
            "teacher_name": teacher.full_name if teacher else "Teacher",
            "created_at": f.created_at.isoformat() if f.created_at else None,
        })
    return result


@router.post("/feedback/{feedback_id}/read")
def mark_read(feedback_id: int, user: User = Depends(_student), db: Session = Depends(get_db)):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id, Feedback.student_id == user.id).first()
    if not fb:
        raise HTTPException(404, "Not found")
    fb.is_read = True
    db.commit()
    return {"ok": True}


# ── Leaderboard ────────────────────────────────────────

@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db), _user: User = Depends(_student)):
    users = db.query(User).filter(User.role == "student")\
        .order_by(User.points.desc()).limit(10).all()
    return [
        {"rank": i + 1, "full_name": u.full_name, "points": u.points,
         "level": u.level, "grade": u.grade}
        for i, u in enumerate(users)
    ]


# ── Statistics ─────────────────────────────────────────

@router.get("/statistics")
def statistics(user: User = Depends(_student), db: Session = Depends(get_db)):
    # Lessons progress
    total_lessons = db.query(Lesson).count()
    completed_lessons = db.query(LessonProgress).filter(
        LessonProgress.user_id == user.id, LessonProgress.completed == True
    ).count()

    # Test scores over time
    attempts = db.query(TestAttempt).filter(TestAttempt.user_id == user.id)\
        .order_by(TestAttempt.completed_at).all()
    test_scores = [
        {
            "date": a.completed_at.strftime("%Y-%m-%d") if a.completed_at else "",
            "score": a.score, "max_score": a.max_score,
            "test_title": db.query(Test).filter(Test.id == a.test_id).first().title if db.query(Test).filter(Test.id == a.test_id).first() else "",
        }
        for a in attempts
    ]

    # Weak topics (modules with lowest avg score)
    modules = db.query(Module).all()
    weak_topics = []
    for m in modules:
        tests = db.query(Test).filter(Test.module_id == m.id).all()
        test_ids = [t.id for t in tests]
        if not test_ids:
            continue
        mod_attempts = db.query(TestAttempt).filter(
            TestAttempt.user_id == user.id, TestAttempt.test_id.in_(test_ids)
        ).all()
        if mod_attempts:
            avg = sum(a.score / a.max_score * 100 if a.max_score else 0 for a in mod_attempts) / len(mod_attempts)
        else:
            avg = 0
        weak_topics.append({"module": m.title, "avg_score": round(avg, 1)})

    weak_topics.sort(key=lambda x: x["avg_score"])

    return {
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "progress_percent": round(completed_lessons / total_lessons * 100, 1) if total_lessons else 0,
        "points": user.points,
        "level": user.level,
        "test_scores": test_scores,
        "weak_topics": weak_topics,
    }


# ── Messenger ─────────────────────────────────────────

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx", ".zip", ".mp3", ".wav", ".webm", ".ogg", ".mp4"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/messages/upload")
async def upload_file(file: UploadFile = File(...), user: User = Depends(_student)):
    """Upload a file for messaging."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {ext} not allowed")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 10MB)")

    filename = f"{uuid.uuid4().hex}{ext}"
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    filepath = os.path.join(uploads_dir, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    return {"url": f"/static/uploads/{filename}", "filename": file.filename}


@router.get("/messages/contacts")
def messenger_contacts(user: User = Depends(_student), db: Session = Depends(get_db)):
    """Get classmates (same grade) and teachers for messaging."""
    contacts = []

    # Classmates (same grade)
    if user.grade:
        classmates = db.query(User).filter(
            User.grade == user.grade, User.role == "student", User.id != user.id
        ).order_by(User.full_name).all()
        for c in classmates:
            last = db.query(DirectMessage).filter(
                ((DirectMessage.sender_id == user.id) & (DirectMessage.receiver_id == c.id)) |
                ((DirectMessage.sender_id == c.id) & (DirectMessage.receiver_id == user.id))
            ).order_by(DirectMessage.created_at.desc()).first()
            unread = db.query(DirectMessage).filter(
                DirectMessage.sender_id == c.id, DirectMessage.receiver_id == user.id,
                DirectMessage.is_read == False
            ).count()
            contacts.append({
                "id": c.id, "full_name": c.full_name, "role": c.role,
                "grade": c.grade,
                "last_message": last.content[:50] if last and last.content else (last.message_type if last else None),
                "last_time": last.created_at.isoformat() if last else None,
                "unread": unread,
            })

    # Teachers
    teachers = db.query(User).filter(User.role == "teacher").order_by(User.full_name).all()
    for t in teachers:
        last = db.query(DirectMessage).filter(
            ((DirectMessage.sender_id == user.id) & (DirectMessage.receiver_id == t.id)) |
            ((DirectMessage.sender_id == t.id) & (DirectMessage.receiver_id == user.id))
        ).order_by(DirectMessage.created_at.desc()).first()
        unread = db.query(DirectMessage).filter(
            DirectMessage.sender_id == t.id, DirectMessage.receiver_id == user.id,
            DirectMessage.is_read == False
        ).count()
        contacts.append({
            "id": t.id, "full_name": t.full_name, "role": t.role,
            "grade": None,
            "last_message": last.content[:50] if last and last.content else (last.message_type if last else None),
            "last_time": last.created_at.isoformat() if last else None,
            "unread": unread,
        })

    return contacts


@router.get("/messages/direct/{other_id}")
def get_direct_messages(other_id: int, user: User = Depends(_student), db: Session = Depends(get_db)):
    """Get DM history with another user."""
    messages = db.query(DirectMessage).filter(
        ((DirectMessage.sender_id == user.id) & (DirectMessage.receiver_id == other_id)) |
        ((DirectMessage.sender_id == other_id) & (DirectMessage.receiver_id == user.id))
    ).order_by(DirectMessage.created_at).all()

    # Mark incoming as read
    db.query(DirectMessage).filter(
        DirectMessage.sender_id == other_id, DirectMessage.receiver_id == user.id,
        DirectMessage.is_read == False
    ).update({"is_read": True})
    db.commit()

    return [
        {
            "id": m.id, "sender_id": m.sender_id,
            "sender_name": m.sender.full_name,
            "content": m.content, "is_mine": m.sender_id == user.id,
            "message_type": m.message_type or "text",
            "file_url": m.file_url,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


@router.post("/messages/direct/{other_id}")
def send_direct_message(other_id: int, req: DirectMessageSend, user: User = Depends(_student), db: Session = Depends(get_db)):
    """Send DM to another user."""
    other = db.query(User).filter(User.id == other_id).first()
    if not other:
        raise HTTPException(404, "User not found")
    msg = DirectMessage(
        sender_id=user.id, receiver_id=other_id,
        content=req.content, message_type=req.message_type, file_url=req.file_url,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "ok": True}


@router.get("/messages/group")
def get_group_messages(user: User = Depends(_student), db: Session = Depends(get_db)):
    """Get group chat for student's grade."""
    if not user.grade:
        return []
    messages = db.query(GroupMessage).filter(
        GroupMessage.grade == user.grade
    ).order_by(GroupMessage.created_at).limit(200).all()
    return [
        {
            "id": m.id, "sender_id": m.sender_id,
            "sender_name": m.sender.full_name,
            "sender_role": m.sender.role,
            "content": m.content, "is_mine": m.sender_id == user.id,
            "message_type": m.message_type or "text",
            "file_url": m.file_url,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


@router.post("/messages/group")
def send_group_message(req: GroupMessageSend, user: User = Depends(_student), db: Session = Depends(get_db)):
    """Send message to student's grade group chat."""
    if not user.grade:
        raise HTTPException(400, "No grade assigned")
    msg = GroupMessage(
        sender_id=user.id, grade=user.grade,
        content=req.content, message_type=req.message_type, file_url=req.file_url,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "ok": True}
