from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from dependencies import get_db
from schemas.auth import RegisterRequest, LoginRequest
from services.auth_service import register_user_service, login_user_service


router = APIRouter(tags=["Authentication"])


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user (admin or tenant)"""
    return register_user_service(data, db)


@router.post("/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    return login_user_service(data, request, db)
