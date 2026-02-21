from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


# ── Auth ───────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    grade: Optional[str] = None
    role: str = "student"


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str


# ── User ───────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    grade: Optional[str] = None
    points: int
    level: str
    streak_days: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    grade: Optional[str] = None
    password: Optional[str] = None  # only updated if provided


class UserProfile(UserOut):
    progress_percent: float = 0
    completed_lessons: int = 0
    total_lessons: int = 0
    badges: list = []


# ── Topic ──────────────────────────────────────────────

class TopicCreate(BaseModel):
    title: str
    description: Optional[str] = None
    grade: int  # 6-11
    order_index: int = 0
    is_final: bool = False
    is_global_final: bool = False


class TopicUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    grade: Optional[int] = None
    order_index: Optional[int] = None
    is_final: Optional[bool] = None
    is_global_final: Optional[bool] = None


class TopicOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    grade: int
    order_index: int
    is_final: bool
    is_global_final: bool

    class Config:
        from_attributes = True


# ── Module / Lesson ────────────────────────────────────

class ModuleOut(BaseModel):
    id: int
    title: str
    order: int
    description: Optional[str] = None
    lessons: list = []

    class Config:
        from_attributes = True


class LessonOut(BaseModel):
    id: int
    module_id: int
    title: str
    content: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    order: int
    grade: int = 6
    topic_id: Optional[int] = None

    class Config:
        from_attributes = True


class LessonCreate(BaseModel):
    module_id: int
    title: str
    content: str = ""
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    order: int = 0
    grade: int = 6
    topic_id: Optional[int] = None


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    order: Optional[int] = None
    module_id: Optional[int] = None
    grade: Optional[int] = None
    topic_id: Optional[int] = None


class ModuleCreate(BaseModel):
    title: str
    order: int = 0
    description: Optional[str] = None


# ── Progress ───────────────────────────────────────────

class ProgressOut(BaseModel):
    id: int
    lesson_id: int
    completed: bool
    time_spent_seconds: int
    last_opened: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MarkCompleteRequest(BaseModel):
    lesson_id: int
    time_spent_seconds: int = 0


# ── Tests ──────────────────────────────────────────────

class QuestionCreate(BaseModel):
    question_type: str
    text: str
    options: Optional[Any] = None
    correct_answer: Any
    explanation: Optional[str] = None
    order: int = 0


class QuestionOut(BaseModel):
    id: int
    question_type: str
    text: str
    options: Optional[Any] = None
    explanation: Optional[str] = None
    order: int

    class Config:
        from_attributes = True


class QuestionOutFull(QuestionOut):
    correct_answer: Any


class TestCreate(BaseModel):
    title: str
    module_id: Optional[int] = None
    difficulty: str = "medium"
    grade: int = 6
    topic_id: Optional[int] = None
    deadline: Optional[datetime] = None
    questions: list[QuestionCreate] = []


class TestUpdate(BaseModel):
    title: Optional[str] = None
    module_id: Optional[int] = None
    difficulty: Optional[str] = None
    grade: Optional[int] = None
    topic_id: Optional[int] = None
    deadline: Optional[datetime] = None
    questions: Optional[list[QuestionCreate]] = None


class TestOut(BaseModel):
    id: int
    title: str
    module_id: Optional[int] = None
    difficulty: str
    grade: int = 6
    topic_id: Optional[int] = None
    deadline: Optional[datetime] = None
    questions: list[QuestionOut] = []

    class Config:
        from_attributes = True


class TestOutFull(BaseModel):
    id: int
    title: str
    module_id: Optional[int] = None
    difficulty: str
    grade: int = 6
    topic_id: Optional[int] = None
    deadline: Optional[datetime] = None
    questions: list[QuestionOutFull] = []

    class Config:
        from_attributes = True


class TestSubmit(BaseModel):
    answers: dict  # {question_id: answer}
    time_spent_seconds: int = 0


class TestAttemptOut(BaseModel):
    id: int
    test_id: int
    score: float
    max_score: float
    answers: Optional[Any] = None
    wrong_answers: Optional[Any] = None
    time_spent_seconds: int
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Code Tasks ─────────────────────────────────────────

class CodeTaskCreate(BaseModel):
    title: str
    description: str
    module_id: Optional[int] = None
    difficulty: str = "medium"
    grade: int = 6
    topic_id: Optional[int] = None
    starter_code: str = ""
    test_cases: list[dict]
    deadline: Optional[datetime] = None


class CodeTaskOut(BaseModel):
    id: int
    title: str
    description: str
    module_id: Optional[int] = None
    difficulty: str
    grade: int = 6
    topic_id: Optional[int] = None
    starter_code: str
    deadline: Optional[datetime] = None

    class Config:
        from_attributes = True


class CodeTaskOutFull(CodeTaskOut):
    test_cases: list[dict]


class CodeTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    module_id: Optional[int] = None
    difficulty: Optional[str] = None
    grade: Optional[int] = None
    topic_id: Optional[int] = None
    starter_code: Optional[str] = None
    test_cases: Optional[list[dict]] = None
    deadline: Optional[datetime] = None


class CodeSubmit(BaseModel):
    code: str


class CodeAttemptOut(BaseModel):
    id: int
    task_id: int
    code: str
    score: float
    max_score: float
    results: Optional[Any] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Chat ───────────────────────────────────────────────

class ChatSend(BaseModel):
    message: str


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Feedback ───────────────────────────────────────────

class FeedbackCreate(BaseModel):
    student_id: int
    message: str


class FeedbackOut(BaseModel):
    id: int
    teacher_id: int
    student_id: int
    message: str
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Badge ──────────────────────────────────────────────

class BadgeOut(BaseModel):
    id: int
    key: str
    title: str
    description: str
    icon: str
    earned_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Messenger ─────────────────────────────────────────

class DirectMessageSend(BaseModel):
    content: str = ""
    message_type: str = "text"
    file_url: Optional[str] = None


class GroupMessageSend(BaseModel):
    content: str = ""
    message_type: str = "text"
    file_url: Optional[str] = None
