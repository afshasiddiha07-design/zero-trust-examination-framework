import secrets
import uuid
import hashlib
import json
import os
from fastapi.responses import FileResponse
from models import AuditLog
from audit import create_audit_log
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pdf_generator import generate_exam_pdf
from database import get_db
from models import Question,Exam,ExamQuestion as ExamQuestionModel
from api.schemas import (
    QuestionCreate,
    QuestionResponse,
    ExamQuestion,
    ExamGenerateRequest
)
from api.auth import require_role

router = APIRouter(prefix="/questions", tags=["Question Bank"])


@router.post("/")
def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    new_question = Question(
        question_text=question.question_text,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_answer=question.correct_answer,
        subject=question.subject,
        difficulty=question.difficulty
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return {
        "message": "Question created successfully",
        "question_id": new_question.id
    }
@router.get("/", response_model=list[QuestionResponse])
def get_questions(
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    questions = db.query(Question).all()

    return questions
@router.get("/exam-preview", response_model=list[ExamQuestion])
def exam_preview(
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    questions = db.query(Question).all()
    return questions
@router.post("/generate")
def generate_exam(
    exam_request: ExamGenerateRequest,
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    query = db.query(Question)

    if exam_request.subject:
        query = query.filter(
            Question.subject == exam_request.subject
        )

    if exam_request.difficulty:
        query = query.filter(
            Question.difficulty == exam_request.difficulty
        )

    questions = query.all()

    if len(questions) < exam_request.number_of_questions:
        raise HTTPException(
            status_code=400,
            detail="Not enough questions available for the requested exam"
        )
    exam_id = str(uuid.uuid4())
    generated_at = datetime.now(timezone.utc).isoformat() 
    selected_questions = secrets.SystemRandom().sample(
     questions,
        exam_request.number_of_questions
    )
    exam_data = [
    {
        "id": question.id,
        "question_text": question.question_text,
        "subject": question.subject,
        "difficulty": question.difficulty
    }
    for question in selected_questions
]

    exam_hash = hashlib.sha256(
    json.dumps(
        exam_data,
        sort_keys=True
    ).encode("utf-8")
    ).hexdigest()
    new_exam = Exam(
    exam_id=exam_id,
    number_of_questions=len(selected_questions),
    generated_at=generated_at,
    integrity_hash=exam_hash
     )

    db.add(new_exam)
    db.flush()

    for question in selected_questions:
       exam_question = ExamQuestionModel(
        exam_id=new_exam.id,
        question_id=question.id
    )
    db.add(exam_question)

    create_audit_log(
    db=db,
    username=current_admin["sub"],
    action="EXAM_GENERATED",
    details=f"Exam {exam_id} generated with {len(selected_questions)} questions"
     )

    db.commit()
    pdf_path = generate_exam_pdf(
    exam_id,
    [
        {
            "question_text": question.question_text,
            "option_a": question.option_a,
            "option_b": question.option_b,
            "option_c": question.option_c,
            "option_d": question.option_d
        }
        for question in selected_questions
    ]
)
    return{
        "pdf_path": pdf_path,
        "exam_id": exam_id,
        "generated_at": generated_at,
        "integrity_hash": exam_hash,
        "message": "Exam generated successfully",
        "number_of_questions": len(selected_questions),
        "questions": [
            {
                "id": question.id,
                "question_text": question.question_text,
                "option_a": question.option_a,
                "option_b": question.option_b,
                "option_c": question.option_c,
                "option_d": question.option_d,
                "subject": question.subject,
                "difficulty": question.difficulty
            }
            for question in selected_questions
        ]
    }
@router.get("/exams")
def get_generated_exams(
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    exams = db.query(Exam).all()

    return exams
@router.get("/exams/{exam_id}/questions")
def get_exam_questions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id
    ).first()

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )

    exam_questions = db.query(ExamQuestionModel).filter(
        ExamQuestionModel.exam_id == exam.id
    ).all()

    questions = []

    for exam_question in exam_questions:
        question = db.query(Question).filter(
            Question.id == exam_question.question_id
        ).first()

        if question:
            questions.append({
                "id": question.id,
                "question_text": question.question_text,
                "option_a": question.option_a,
                "option_b": question.option_b,
                "option_c": question.option_c,
                "option_d": question.option_d,
                "subject": question.subject,
                "difficulty": question.difficulty
            })

    return {
        "exam_id": exam.exam_id,
        "number_of_questions": len(questions),
        "questions": questions
    }
@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    from models import AuditLog

    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.id.asc())
        .all()
    )

    return logs
@router.get("/audit-logs/verify")
def verify_audit_logs(
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.id.asc())
        .all()
    )

    previous_hash = ""

    for log in logs:
        log_data = {
            "username": log.username,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp,
            "previous_hash": log.previous_hash
        }

        calculated_hash = hashlib.sha256(
            json.dumps(
                log_data,
                sort_keys=True
            ).encode("utf-8")
        ).hexdigest()

        if log.previous_hash != previous_hash:
            return {
                "valid": False,
                "message": f"Hash chain broken at log {log.id}"
            }

        if log.log_hash != calculated_hash:
            return {
                "valid": False,
                "message": f"Log {log.id} has been modified"
            }

        previous_hash = log.log_hash

    return {
        "valid": True,
        "message": "Audit log chain is valid",
        "number_of_logs": len(logs)
    }
@router.get("/exams/{exam_id}/pdf")
def download_exam_pdf(
    exam_id: str,
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    pdf_path = f"generated_pdfs/exam_{exam_id}.pdf"

    if not os.path.exists(pdf_path):
        raise HTTPException(
            status_code=404,
            detail="Exam PDF not found"
        )

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"exam_{exam_id}.pdf"
    )
@router.get("/exams/{exam_id}/answer-key")
def get_answer_key(
    exam_id: str,
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    exam = db.query(Exam).filter(
        Exam.exam_id == exam_id
    ).first()

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )

    exam_questions = (
        db.query(ExamQuestionModel)
        .filter(ExamQuestionModel.exam_id == exam.id)
        .all()
    )

    answer_key = []

    for exam_question in exam_questions:
        question = db.query(Question).filter(
            Question.id == exam_question.question_id
        ).first()

        if question:
            answer_key.append({
                "question_id": question.id,
                "correct_answer": question.correct_answer
            })

    return {
        "exam_id": exam_id,
        "number_of_answers": len(answer_key),
        "answer_key": answer_key
    }
@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    db.delete(question)
    db.commit()

    return {
        "message": "Question deleted successfully"
    }
@router.put("/{question_id}")
def update_question(
    question_id: int,
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    existing_question = db.query(Question).filter(
        Question.id == question_id
    ).first()

    if not existing_question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    existing_question.question_text = question.question_text
    existing_question.option_a = question.option_a
    existing_question.option_b = question.option_b
    existing_question.option_c = question.option_c
    existing_question.option_d = question.option_d
    existing_question.correct_answer = question.correct_answer
    existing_question.subject = question.subject
    existing_question.difficulty = question.difficulty

    db.commit()
    db.refresh(existing_question)

    return {
        "message": "Question updated successfully",
        "question_id": existing_question.id
    }