import csv
import io
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import (
    User, Module, Lesson, LessonProgress, Test, Question,
    TestAttempt, CodeTask, CodeAttempt, Feedback,
    DirectMessage, GroupMessage, Topic,
)
from app.schemas.schemas import (
    LessonCreate, LessonUpdate, ModuleCreate, TestCreate, TestUpdate,
    CodeTaskCreate, CodeTaskUpdate, FeedbackCreate,
    DirectMessageSend, GroupMessageSend,
    TopicCreate, TopicUpdate, TopicOut,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


def _teacher(user: User = Depends(get_current_user)):
    if user.role != "teacher":
        raise HTTPException(403, "Teachers only")
    return user


# ── Dashboard ──────────────────────────────────────────

@router.get("/dashboard")
def dashboard(user: User = Depends(_teacher), db: Session = Depends(get_db)):
    num_students = db.query(User).filter(User.role == "student").count()
    avg_score = db.query(func.avg(TestAttempt.score)).scalar() or 0

    recent = db.query(TestAttempt).order_by(TestAttempt.completed_at.desc()).limit(10).all()
    activity = []
    for a in recent:
        student = db.query(User).filter(User.id == a.user_id).first()
        test = db.query(Test).filter(Test.id == a.test_id).first()
        activity.append({
            "student": student.full_name if student else "Unknown",
            "test": test.title if test else "Unknown",
            "score": a.score, "max_score": a.max_score,
            "date": a.completed_at.isoformat() if a.completed_at else None,
        })

    return {
        "num_students": num_students,
        "avg_score": round(float(avg_score), 1),
        "recent_activity": activity,
    }


# ── Student Management ─────────────────────────────────

@router.get("/students")
def list_students(grade: str = None, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    q = db.query(User).filter(User.role == "student")
    if grade:
        q = q.filter(User.grade == grade)
    students = q.order_by(User.full_name).all()

    result = []
    total_lessons = db.query(Lesson).count()
    for s in students:
        completed = db.query(LessonProgress).filter(
            LessonProgress.user_id == s.id, LessonProgress.completed == True
        ).count()
        attempts = db.query(TestAttempt).filter(TestAttempt.user_id == s.id).all()
        avg = (sum(a.score / a.max_score * 100 if a.max_score else 0 for a in attempts) / len(attempts)) if attempts else 0

        result.append({
            "id": s.id, "username": s.username, "full_name": s.full_name,
            "grade": s.grade, "points": s.points, "level": s.level,
            "completed_lessons": completed, "total_lessons": total_lessons,
            "progress_percent": round(completed / total_lessons * 100, 1) if total_lessons else 0,
            "avg_test_score": round(avg, 1),
            "streak_days": s.streak_days,
        })
    return result


@router.get("/students/{student_id}")
def student_detail(student_id: int, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Student not found")

    total_lessons = db.query(Lesson).count()
    completed = db.query(LessonProgress).filter(
        LessonProgress.user_id == student.id, LessonProgress.completed == True
    ).count()

    attempts = db.query(TestAttempt).filter(TestAttempt.user_id == student.id)\
        .order_by(TestAttempt.completed_at.desc()).all()
    test_history = []
    for a in attempts:
        test = db.query(Test).filter(Test.id == a.test_id).first()
        test_history.append({
            "test_title": test.title if test else "Unknown",
            "score": a.score, "max_score": a.max_score,
            "date": a.completed_at.isoformat() if a.completed_at else None,
        })

    # Weak topics
    modules = db.query(Module).all()
    weak_topics = []
    for m in modules:
        tests = db.query(Test).filter(Test.module_id == m.id).all()
        test_ids = [t.id for t in tests]
        if not test_ids:
            continue
        mod_attempts = [a for a in attempts if a.test_id in test_ids]
        if mod_attempts:
            avg = sum(a.score / a.max_score * 100 if a.max_score else 0 for a in mod_attempts) / len(mod_attempts)
        else:
            avg = 0
        weak_topics.append({"module": m.title, "avg_score": round(avg, 1)})
    weak_topics.sort(key=lambda x: x["avg_score"])

    return {
        "id": student.id, "full_name": student.full_name, "username": student.username,
        "grade": student.grade, "points": student.points, "level": student.level,
        "streak_days": student.streak_days,
        "completed_lessons": completed, "total_lessons": total_lessons,
        "progress_percent": round(completed / total_lessons * 100, 1) if total_lessons else 0,
        "test_history": test_history,
        "weak_topics": weak_topics,
    }


# ── Content Management ─────────────────────────────────

@router.get("/modules")
def list_modules(db: Session = Depends(get_db), user: User = Depends(_teacher)):
    modules = db.query(Module).order_by(Module.order).all()
    return [
        {
            "id": m.id, "title": m.title, "order": m.order,
            "description": m.description,
            "lesson_count": len(m.lessons),
        }
        for m in modules
    ]


@router.post("/modules")
def create_module(req: ModuleCreate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    m = Module(title=req.title, order=req.order, description=req.description)
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"id": m.id, "title": m.title}


@router.get("/lessons")
def list_lessons(db: Session = Depends(get_db), user: User = Depends(_teacher)):
    lessons = db.query(Lesson).order_by(Lesson.module_id, Lesson.order).all()
    return [
        {
            "id": l.id, "title": l.title, "module_id": l.module_id,
            "order": l.order, "content": l.content or "",
            "image_url": l.image_url, "video_url": l.video_url,
            "grade": l.grade or 6, "topic_id": l.topic_id,
        }
        for l in lessons
    ]


@router.post("/lessons")
def create_lesson(req: LessonCreate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    lesson = Lesson(**req.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return {"id": lesson.id, "title": lesson.title}


@router.put("/lessons/{lesson_id}")
def update_lesson(lesson_id: int, req: LessonUpdate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    for key, val in req.model_dump(exclude_unset=True).items():
        setattr(lesson, key, val)
    db.commit()
    return {"ok": True}


@router.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    db.delete(lesson)
    db.commit()
    return {"ok": True}


# ── Tests Management ───────────────────────────────────

@router.get("/tests")
def list_tests(db: Session = Depends(get_db), user: User = Depends(_teacher)):
    tests = db.query(Test).order_by(Test.created_at.desc()).all()
    return [
        {
            "id": t.id, "title": t.title, "difficulty": t.difficulty,
            "module_id": t.module_id, "grade": t.grade or 6, "topic_id": t.topic_id,
            "question_count": len(t.questions),
            "deadline": t.deadline.isoformat() if t.deadline else None,
            "attempt_count": len(t.attempts),
        }
        for t in tests
    ]


@router.post("/tests")
def create_test(req: TestCreate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    test = Test(
        title=req.title, module_id=req.module_id, difficulty=req.difficulty,
        grade=req.grade, topic_id=req.topic_id, deadline=req.deadline,
    )
    db.add(test)
    db.flush()
    for q in req.questions:
        db.add(Question(test_id=test.id, **q.model_dump()))
    db.commit()
    db.refresh(test)
    return {"id": test.id, "title": test.title}


@router.get("/tests/{test_id}")
def get_test_detail(test_id: int, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(404, "Test not found")
    return {
        "id": test.id, "title": test.title, "difficulty": test.difficulty,
        "module_id": test.module_id, "grade": test.grade or 6, "topic_id": test.topic_id,
        "deadline": test.deadline.isoformat() if test.deadline else None,
        "questions": [
            {
                "id": q.id, "question_type": q.question_type, "text": q.text,
                "options": q.options, "correct_answer": q.correct_answer,
                "explanation": q.explanation, "order": q.order,
            }
            for q in test.questions
        ],
    }


@router.put("/tests/{test_id}")
def update_test(test_id: int, req: TestUpdate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(404, "Test not found")

    attempt_count = db.query(TestAttempt).filter(TestAttempt.test_id == test_id).count()

    # Update scalar fields
    for field in ("title", "module_id", "difficulty", "grade", "topic_id", "deadline"):
        val = getattr(req, field, None)
        if val is not None:
            setattr(test, field, val)

    # Replace questions only if no student attempts yet
    if req.questions is not None:
        if attempt_count > 0:
            db.commit()
            return {"ok": True, "attempts_preserved": True, "attempt_count": attempt_count}
        db.query(Question).filter(Question.test_id == test_id).delete()
        for q in req.questions:
            db.add(Question(test_id=test_id, **q.model_dump()))

    db.commit()
    return {"ok": True, "attempts_preserved": False}


@router.delete("/tests/{test_id}")
def delete_test(test_id: int, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(404, "Test not found")
    attempt_count = db.query(TestAttempt).filter(TestAttempt.test_id == test_id).count()
    if attempt_count > 0:
        raise HTTPException(409, f"Cannot delete test: {attempt_count} student attempt(s) exist. Edit the test instead.")
    db.delete(test)
    db.commit()
    return {"ok": True}


# ── Code Tasks Management ─────────────────────────────

@router.get("/code-tasks")
def list_code_tasks(db: Session = Depends(get_db), user: User = Depends(_teacher)):
    tasks = db.query(CodeTask).all()
    return [
        {
            "id": t.id, "title": t.title, "difficulty": t.difficulty,
            "module_id": t.module_id, "grade": t.grade or 6, "topic_id": t.topic_id,
            "test_case_count": len(t.test_cases),
        }
        for t in tasks
    ]


@router.post("/code-tasks")
def create_code_task(req: CodeTaskCreate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    task = CodeTask(**req.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"id": task.id, "title": task.title}


@router.get("/code-tasks/{task_id}")
def get_code_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    task = db.query(CodeTask).filter(CodeTask.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    return {
        "id": task.id, "title": task.title, "description": task.description,
        "module_id": task.module_id, "difficulty": task.difficulty,
        "grade": task.grade or 6, "topic_id": task.topic_id,
        "starter_code": task.starter_code or "",
        "test_cases": task.test_cases or [],
        "deadline": task.deadline.isoformat() if task.deadline else None,
    }


@router.put("/code-tasks/{task_id}")
def update_code_task(task_id: int, req: CodeTaskUpdate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    task = db.query(CodeTask).filter(CodeTask.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(task, field, val)
    db.commit()
    return {"ok": True}


# ── Topics Management ──────────────────────────────────

@router.get("/topics", response_model=list[TopicOut])
def list_topics(grade: int = None, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    q = db.query(Topic)
    if grade is not None:
        q = q.filter(Topic.grade == grade)
    return q.order_by(Topic.grade, Topic.order_index).all()


@router.post("/topics", response_model=TopicOut)
def create_topic(req: TopicCreate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    topic = Topic(**req.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.put("/topics/{topic_id}", response_model=TopicOut)
def update_topic(topic_id: int, req: TopicUpdate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(404, "Topic not found")
    for key, val in req.model_dump(exclude_unset=True).items():
        setattr(topic, key, val)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/topics/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(404, "Topic not found")
    lesson_count = db.query(Lesson).filter(Lesson.topic_id == topic_id).count()
    if lesson_count > 0:
        raise HTTPException(409, f"Cannot delete topic: {lesson_count} lesson(s) attached. Reassign them first.")
    db.delete(topic)
    db.commit()
    return {"ok": True}


@router.delete("/code-tasks/{task_id}")
def delete_code_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    task = db.query(CodeTask).filter(CodeTask.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}


# ── Analytics ──────────────────────────────────────────

@router.get("/analytics")
def analytics(db: Session = Depends(get_db), user: User = Depends(_teacher)):
    modules = db.query(Module).order_by(Module.order).all()
    module_stats = []
    for m in modules:
        tests = db.query(Test).filter(Test.module_id == m.id).all()
        test_ids = [t.id for t in tests]
        if test_ids:
            attempts = db.query(TestAttempt).filter(TestAttempt.test_id.in_(test_ids)).all()
            if attempts:
                avg = sum(a.score / a.max_score * 100 if a.max_score else 0 for a in attempts) / len(attempts)
            else:
                avg = 0
        else:
            avg = 0
            attempts = []
        module_stats.append({
            "module": m.title, "avg_score": round(avg, 1),
            "attempt_count": len(attempts),
        })

    # Overall weak topics
    module_stats_sorted = sorted(module_stats, key=lambda x: x["avg_score"])

    return {
        "module_stats": module_stats,
        "weak_topics": module_stats_sorted[:3],
    }


# ── Reports Export ─────────────────────────────────────

@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db), user: User = Depends(_teacher)):
    students = db.query(User).filter(User.role == "student").all()
    total_lessons = db.query(Lesson).count()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Username", "Grade", "Points", "Level",
                     "Completed Lessons", "Total Lessons", "Progress %", "Avg Test Score"])

    for s in students:
        completed = db.query(LessonProgress).filter(
            LessonProgress.user_id == s.id, LessonProgress.completed == True
        ).count()
        attempts = db.query(TestAttempt).filter(TestAttempt.user_id == s.id).all()
        avg = (sum(a.score / a.max_score * 100 if a.max_score else 0 for a in attempts) / len(attempts)) if attempts else 0
        pct = round(completed / total_lessons * 100, 1) if total_lessons else 0
        writer.writerow([s.full_name, s.username, s.grade, s.points, s.level,
                         completed, total_lessons, pct, round(avg, 1)])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students_report.csv"},
    )


@router.get("/export/pdf")
def export_pdf(db: Session = Depends(get_db), user: User = Depends(_teacher)):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    students = db.query(User).filter(User.role == "student").all()
    total_lessons = db.query(Lesson).count()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Student Report", styles["Title"]))
    elements.append(Spacer(1, 20))

    data = [["Name", "Grade", "Points", "Level", "Progress %", "Avg Score"]]
    for s in students:
        completed = db.query(LessonProgress).filter(
            LessonProgress.user_id == s.id, LessonProgress.completed == True
        ).count()
        attempts = db.query(TestAttempt).filter(TestAttempt.user_id == s.id).all()
        avg = (sum(a.score / a.max_score * 100 if a.max_score else 0 for a in attempts) / len(attempts)) if attempts else 0
        pct = round(completed / total_lessons * 100, 1) if total_lessons else 0
        data.append([s.full_name, s.grade or "-", str(s.points), s.level, f"{pct}%", f"{round(avg, 1)}%"])

    table = Table(data)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
    ]))
    elements.append(table)
    doc.build(elements)

    buf.seek(0)
    return StreamingResponse(
        buf, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=students_report.pdf"},
    )


# ── AI Content Generation ─────────────────────────────

@router.post("/ai/generate-test")
def ai_generate_test(req: dict, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    from app.utils.ai_content import generate_test
    module_id = req.get("module_id")
    difficulty = req.get("difficulty", "medium")
    num_questions = req.get("num_questions", 5)
    lang = req.get("lang", "ru")

    module_title = "Python Programming"
    if module_id:
        mod = db.query(Module).filter(Module.id == module_id).first()
        if mod:
            module_title = mod.title

    try:
        data = generate_test(module_title, difficulty, num_questions, lang)
        return data
    except Exception as e:
        raise HTTPException(500, f"AI generation failed: {str(e)}")


@router.post("/ai/generate-lesson")
def ai_generate_lesson(req: dict, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    from app.utils.ai_content import generate_lesson
    module_id = req.get("module_id")
    topic = req.get("topic", "")
    lang = req.get("lang", "ru")

    module_title = "Python Programming"
    if module_id:
        mod = db.query(Module).filter(Module.id == module_id).first()
        if mod:
            module_title = mod.title

    try:
        data = generate_lesson(module_title, topic or module_title, lang)
        return data
    except Exception as e:
        raise HTTPException(500, f"AI generation failed: {str(e)}")


@router.post("/ai/generate-task")
def ai_generate_task(req: dict, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    from app.utils.ai_content import generate_code_task
    module_id = req.get("module_id")
    difficulty = req.get("difficulty", "medium")
    lang = req.get("lang", "ru")

    module_title = "Python Programming"
    if module_id:
        mod = db.query(Module).filter(Module.id == module_id).first()
        if mod:
            module_title = mod.title

    try:
        data = generate_code_task(module_title, difficulty, lang)
        return data
    except Exception as e:
        raise HTTPException(500, f"AI generation failed: {str(e)}")


# ── Feedback ───────────────────────────────────────────

@router.post("/feedback")
def send_feedback(req: FeedbackCreate, db: Session = Depends(get_db), user: User = Depends(_teacher)):
    student = db.query(User).filter(User.id == req.student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Student not found")
    fb = Feedback(teacher_id=user.id, student_id=req.student_id, message=req.message)
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {"id": fb.id, "ok": True}


@router.get("/feedback")
def all_feedback(db: Session = Depends(get_db), user: User = Depends(_teacher)):
    items = db.query(Feedback).filter(Feedback.teacher_id == user.id)\
        .order_by(Feedback.created_at.desc()).all()
    result = []
    for f in items:
        student = db.query(User).filter(User.id == f.student_id).first()
        result.append({
            "id": f.id, "student_id": f.student_id,
            "student_name": student.full_name if student else "Unknown",
            "message": f.message, "is_read": f.is_read,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        })
    return result


# ── Messenger ─────────────────────────────────────────

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx", ".zip", ".mp3", ".wav", ".webm", ".ogg", ".mp4"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/messages/upload")
async def upload_file(file: UploadFile = File(...), user: User = Depends(_teacher)):
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
def messenger_contacts(user: User = Depends(_teacher), db: Session = Depends(get_db)):
    """List all students grouped by grade for messaging."""
    students = db.query(User).filter(User.role == "student").order_by(User.grade, User.full_name).all()
    contacts = []
    for s in students:
        last = db.query(DirectMessage).filter(
            ((DirectMessage.sender_id == user.id) & (DirectMessage.receiver_id == s.id)) |
            ((DirectMessage.sender_id == s.id) & (DirectMessage.receiver_id == user.id))
        ).order_by(DirectMessage.created_at.desc()).first()
        unread = db.query(DirectMessage).filter(
            DirectMessage.sender_id == s.id, DirectMessage.receiver_id == user.id,
            DirectMessage.is_read == False
        ).count()
        contacts.append({
            "id": s.id, "full_name": s.full_name, "role": s.role,
            "grade": s.grade,
            "last_message": last.content[:50] if last and last.content else (last.message_type if last else None),
            "last_time": last.created_at.isoformat() if last else None,
            "unread": unread,
        })
    return contacts


@router.get("/messages/grades")
def messenger_grades(user: User = Depends(_teacher), db: Session = Depends(get_db)):
    """List all grades that have students."""
    grades = db.query(User.grade).filter(
        User.role == "student", User.grade.isnot(None), User.grade != ""
    ).distinct().order_by(User.grade).all()
    return [g[0] for g in grades]


@router.get("/messages/direct/{user_id}")
def get_direct_messages(user_id: int, user: User = Depends(_teacher), db: Session = Depends(get_db)):
    """Get DM history with a student."""
    messages = db.query(DirectMessage).filter(
        ((DirectMessage.sender_id == user.id) & (DirectMessage.receiver_id == user_id)) |
        ((DirectMessage.sender_id == user_id) & (DirectMessage.receiver_id == user.id))
    ).order_by(DirectMessage.created_at).all()

    # Mark incoming as read
    db.query(DirectMessage).filter(
        DirectMessage.sender_id == user_id, DirectMessage.receiver_id == user.id,
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


@router.post("/messages/direct/{user_id}")
def send_direct_message(user_id: int, req: DirectMessageSend, user: User = Depends(_teacher), db: Session = Depends(get_db)):
    """Send DM to a student."""
    other = db.query(User).filter(User.id == user_id).first()
    if not other:
        raise HTTPException(404, "User not found")
    msg = DirectMessage(
        sender_id=user.id, receiver_id=user_id,
        content=req.content, message_type=req.message_type, file_url=req.file_url,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "ok": True}


@router.get("/messages/group/{grade}")
def get_group_messages(grade: str, user: User = Depends(_teacher), db: Session = Depends(get_db)):
    """Get group chat for a specific grade."""
    messages = db.query(GroupMessage).filter(
        GroupMessage.grade == grade
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


@router.post("/messages/group/{grade}")
def send_group_message(grade: str, req: GroupMessageSend, user: User = Depends(_teacher), db: Session = Depends(get_db)):
    """Send message to a grade's group chat."""
    msg = GroupMessage(
        sender_id=user.id, grade=grade,
        content=req.content, message_type=req.message_type, file_url=req.file_url,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "ok": True}
