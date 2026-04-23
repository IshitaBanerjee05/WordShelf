from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import user, schemas
from app.core import security
from app.core.dependencies import get_current_active_user
from datetime import timedelta

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

class UpdateProfileRequest(BaseModel):
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: user.User = Depends(get_current_active_user)):
    """Return the currently authenticated user's profile."""
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """Update the current user's email and/or password."""
    if data.email and data.email != current_user.email:
        existing = db.query(user.User).filter(
            user.User.email == data.email,
            user.User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use.")
        current_user.email = data.email

    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password.")
        if not security.verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        current_user.hashed_password = security.get_password_hash(data.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(user.User).filter(
        (user.User.username == user_in.username) | (user.User.email == user_in.email)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    hashed_password = security.get_password_hash(user_in.password)
    new_user = user.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(user.User).filter(user.User.username == form_data.username).first()
    if not db_user or not security.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
