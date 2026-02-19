from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.utils.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "Username already taken")

    user = User(
        username=req.username,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=req.role if req.role in ("student", "teacher") else "student",
        grade=req.grade,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token, role=user.role,
        user_id=user.id, full_name=user.full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    # update streak
    today = datetime.utcnow().strftime("%Y-%m-%d")
    if user.last_activity_date:
        from datetime import timedelta
        yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
        if user.last_activity_date == yesterday:
            user.streak_days += 1
        elif user.last_activity_date != today:
            user.streak_days = 1
    else:
        user.streak_days = 1
    user.last_activity_date = today
    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token, role=user.role,
        user_id=user.id, full_name=user.full_name,
    )
