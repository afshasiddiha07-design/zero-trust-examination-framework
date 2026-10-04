from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_db
from api.schemas import AdminRegister, AdminLogin
from models import Admin
from security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)
from api.schemas import AdminRegister,AdminLogin

security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/status")
def auth_status():
    return {"message": "Authentication module is working"}
def require_role(allowed_roles: list[str]):
    def role_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        token = credentials.credentials
        payload = verify_access_token(token)

        user_role = payload.get("role")

        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource"
            )

        return payload

    return role_checker

@router.post("/register")
def register_admin(
    admin: AdminRegister,
    db: Session = Depends(get_db)
):
    existing_admin = db.query(Admin).filter(
        Admin.username == admin.username
    ).first()

    if existing_admin:
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )

    hashed_password = hash_password(admin.password)

    new_admin = Admin(
        username=admin.username,
        password_hash=hashed_password
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {
        "message": "Admin registered successfully",
        "username": new_admin.username
    }
@router.get("/me")
def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    payload = verify_access_token(token)

    return {
        "message": "Authentication successful",
        "username": payload["sub"],
        "role": payload["role"]
    }
@router.post("/login")
def login_admin(
    admin: AdminLogin,
    db: Session = Depends(get_db)
):
    existing_admin = (
        db.query(Admin)
        .filter(Admin.username == admin.username)
        .first()
    )

    if not existing_admin:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(
        admin.password,
        existing_admin.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token(
        data={
            "sub": existing_admin.username,
            "role": existing_admin.role
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }
@router.get("/admin-dashboard")
def admin_dashboard(
    current_admin=Depends(require_role(["EXAM_ADMIN"]))
):
    return {
        "message": "Welcome to the Exam Admin Dashboard",
        "username": current_admin["sub"],
        "role": current_admin["role"]
    }