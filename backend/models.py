from sqlalchemy import Column, Integer, String,ForeignKey
from database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="EXAM_ADMIN", nullable=False)
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(String, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_answer = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(String, unique=True, nullable=False, index=True)
    number_of_questions = Column(Integer, nullable=False)
    generated_at = Column(String, nullable=False)
    integrity_hash = Column(String, nullable=False)
class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    previous_hash = Column(String, nullable=True)
    log_hash = Column(String, nullable=False)