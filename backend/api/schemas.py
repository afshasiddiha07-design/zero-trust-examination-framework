from pydantic import BaseModel


class AdminRegister(BaseModel):
    username: str
    password: str
class AdminLogin(BaseModel):
    username: str
    password: str
class QuestionCreate(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    subject: str
    difficulty: str
class QuestionResponse(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    subject: str
    difficulty: str
class ExamQuestion(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    subject: str
    difficulty: str
class ExamGenerateRequest(BaseModel):
    number_of_questions: int
    subject: str | None = None
    difficulty: str | None = None