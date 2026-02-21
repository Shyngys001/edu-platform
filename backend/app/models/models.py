import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class QuestionType(str, enum.Enum):
    mcq = "mcq"
    find_bug = "find_bug"
    choose_code = "choose_code"
    matching = "matching"


# ── Users ──────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(10), nullable=False, default="student")
    grade = Column(String(20), nullable=True)
    points = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    streak_days = Column(Integer, default=0)
    last_activity_date = Column(String(10), nullable=True)
    max_unlocked_grade = Column(Integer, default=6)

    # relationships
    progress = relationship("LessonProgress", back_populates="user", cascade="all,delete")
    test_attempts = relationship("TestAttempt", back_populates="user", cascade="all,delete")
    code_attempts = relationship("CodeAttempt", back_populates="user", cascade="all,delete")
    badges = relationship("UserBadge", back_populates="user", cascade="all,delete")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all,delete")
    received_feedback = relationship(
        "Feedback", back_populates="student",
        foreign_keys="Feedback.student_id", cascade="all,delete"
    )

    @property
    def level(self):
        if self.points >= 500:
            return "Advanced"
        if self.points >= 200:
            return "Intermediate"
        return "Beginner"


# ── Topics ─────────────────────────────────────────────

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    grade = Column(Integer, nullable=False, index=True)  # 6-11
    order_index = Column(Integer, default=0)
    is_final = Column(Boolean, default=False)        # final topic for this grade
    is_global_final = Column(Boolean, default=False) # the grand final after all grades

    lessons = relationship("Lesson", back_populates="topic")
    tests = relationship("Test", back_populates="topic")


# ── Modules & Lessons ──────────────────────────────────

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    order = Column(Integer, default=0)
    description = Column(Text, nullable=True)

    lessons = relationship("Lesson", back_populates="module", cascade="all,delete",
                           order_by="Lesson.order")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False, default="")
    image_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    order = Column(Integer, default=0)
    grade = Column(Integer, default=6)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    module = relationship("Module", back_populates="lessons")
    topic = relationship("Topic", back_populates="lessons")
    progress = relationship("LessonProgress", back_populates="lesson", cascade="all,delete")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    completed = Column(Boolean, default=False)
    time_spent_seconds = Column(Integer, default=0)
    last_opened = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")


# ── Tests & Questions ──────────────────────────────────

class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
    difficulty = Column(String(10), default="medium")
    grade = Column(Integer, default=6)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    topic = relationship("Topic", back_populates="tests")
    questions = relationship("Question", back_populates="test", cascade="all,delete",
                             order_by="Question.order")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all,delete")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    question_type = Column(String(20), nullable=False)  # mcq, find_bug, choose_code, matching
    text = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)      # list of options / matching pairs
    correct_answer = Column(JSON, nullable=False)  # answer key
    explanation = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    test = relationship("Test", back_populates="questions")


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, default=0)
    max_score = Column(Float, default=0)
    answers = Column(JSON, nullable=True)
    wrong_answers = Column(JSON, nullable=True)
    time_spent_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="test_attempts")
    test = relationship("Test", back_populates="attempts")


# ── Code Tasks ─────────────────────────────────────────

class CodeTask(Base):
    __tablename__ = "code_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
    difficulty = Column(String(10), default="medium")
    grade = Column(Integer, default=6)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    starter_code = Column(Text, default="")
    test_cases = Column(JSON, nullable=False)  # [{input, expected_output}, ...]
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempts = relationship("CodeAttempt", back_populates="task", cascade="all,delete")


class CodeAttempt(Base):
    __tablename__ = "code_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, ForeignKey("code_tasks.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=False)
    score = Column(Float, default=0)
    max_score = Column(Float, default=0)
    results = Column(JSON, nullable=True)  # per-case pass/fail
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="code_attempts")
    task = relationship("CodeTask", back_populates="attempts")


# ── Badges ─────────────────────────────────────────────

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(300), nullable=False)
    icon = Column(String(10), default="🏅")

    users = relationship("UserBadge", back_populates="badge", cascade="all,delete")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="users")


# ── Chat / AI ──────────────────────────────────────────

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(10), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")


# ── Feedback ───────────────────────────────────────────

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("User", back_populates="received_feedback", foreign_keys=[student_id])


# ── Direct Messages ───────────────────────────────────

class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, default="")
    message_type = Column(String(20), default="text")  # text | file | voice
    file_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


# ── Group Messages ────────────────────────────────────

class GroupMessage(Base):
    __tablename__ = "group_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    grade = Column(String(20), nullable=False, index=True)
    content = Column(Text, default="")
    message_type = Column(String(20), default="text")  # text | file | voice
    file_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
