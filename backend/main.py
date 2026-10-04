from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from models import Admin, Exam
from api.auth import router as auth_router
from api.questions import router as questions_router
from api.security import router as security_router


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Zero-Trust Examination Framework"
)


# Allow the React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API routers
app.include_router(auth_router)
app.include_router(questions_router)
app.include_router(security_router)


@app.get("/")
def home():
    return {
        "message": "Zero-Trust Examination Framework API is running"
    }