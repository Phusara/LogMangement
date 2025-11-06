from datetime import datetime
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from schemas.auth import RegisterRequest, LoginRequest
from utils.security import hash_password, verify_password, create_access_token
from services.alerts_service import check_failed_login_threshold, create_alert_log, failed_login_attempts
import entity.models as models


def register_user_service(data: RegisterRequest, db: Session):
    """Register a new user (admin or tenant)"""
    existing = db.query(models.User).filter(models.User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed = hash_password(data.password)
    user = models.User(
        username=data.username,
        password=hashed,
        role=data.role,
        created_at=datetime.utcnow(),
    )

    db.add(user)
    db.flush()

    timestamp = datetime.utcnow()
    if user.role == "admin":
        db.add(models.Admin(user_id=user.id, name=user.username, timestamp=timestamp))
    else:
        db.add(models.tenant(user_id=user.id, name=user.username, timestamp=timestamp))

    db.commit()
    db.refresh(user)

    return {"status": "registered", "username": user.username, "role": user.role}


def login_user_service(data: LoginRequest, request: Request, db: Session):
    """Login user and return JWT token"""
    user = db.query(models.User).filter(models.User.username == data.username).first()
    
    client_ip = request.client.host

    if not user or not verify_password(data.password, user.password):
        # Check for brute force attempt
        if check_failed_login_threshold(client_ip):
            user_id = user.id if user else None
            create_alert_log(client_ip, data.username, user_id, db)
            raise HTTPException(
                status_code=429, 
                detail="Too many failed login attempts. Account temporarily locked."
            )
        
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Clear failed attempts on successful login
    if client_ip in failed_login_attempts:
        failed_login_attempts[client_ip].clear()

    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role
    }

    access_token = create_access_token(token_data)
    return {"access_token": access_token, "token_type": "bearer"}
