from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from uuid import uuid4
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi.security import OAuth2PasswordRequestForm

from app.db.database import get_db
from app.auth.schemas import (
    UserLogin,
    UserRegister,
    OAuthPayload,
    UserTypeUpdate,
    UserRead,
)
from app.auth.user_repo import UserRepository
from app.auth.jwt_utils import create_access_token
from app.auth.security import verify_password
from app.auth.dependencies import get_current_user
from app.config.settings import settings

import secrets

router = APIRouter(prefix="/auth", tags=["auth"])

# ==================================================
# GOOGLE OAUTH
# ==================================================

@router.post("/google")
def google_oauth(
    payload: OAuthPayload,
    db: Session = Depends(get_db),
):
    google_client_id = (settings.GOOGLE_CLIENT_ID or "").strip()

    if not google_client_id:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")

    try:
        idinfo = id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            google_client_id,
        )
    except Exception as exc:
        detail = "Invalid Google token"
        if settings.ENV == "local":
            detail = f"Invalid Google token: {str(exc)}"
        raise HTTPException(status_code=401, detail=detail)

    token_email = idinfo.get("email")
    if not token_email:
        raise HTTPException(status_code=401, detail="Google token missing email claim")

    if not idinfo.get("email_verified", False):
        raise HTTPException(status_code=401, detail="Google email is not verified")

    repo = UserRepository(db)

    try:
        user = repo.get_or_create_oauth_user(
            user_id=str(uuid4()),
            email=token_email,
            provider="google",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "user_type": user.user_type,
            "type": "access",
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserRead.from_orm(user),
    }


# ==================================================
# REGISTER (LOCAL)
# ==================================================

@router.post("/register")
def register(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)

    try:
        user = repo.create_local_user(
            user_id=str(uuid4()),
            email=payload.email,
            password=payload.password,
            user_type=payload.user_type or "professional",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "user_type": user.user_type,
            "type": "access",
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserRead.from_orm(user),
    }


# ==================================================
# LOGIN (Swagger Compatible)
# ==================================================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2 password flow compatible.
    Swagger Authorize button uses this.
    """

    repo = UserRepository(db)
    user = repo.get_by_email(form_data.username)

    if not user or user.provider != "local":
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "user_type": user.user_type,
            "type": "access",
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


# ==================================================
# FORGOT PASSWORD
# ==================================================

@router.post("/forgot-password")
def forgot_password(
    email: str = Body(...),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)

    user = repo.get_by_email(email)

    # Avoid email enumeration
    if not user or user.provider != "local":
        return {"message": "If account exists, reset link sent"}

    reset_token = secrets.token_urlsafe(32)

    repo.set_reset_token(email=email, token=reset_token)

    # DEV MODE: return token
    return {
        "message": "Reset token generated (dev mode)",
        "reset_token": reset_token,
    }


# ==================================================
# RESET PASSWORD
# ==================================================

@router.post("/reset-password")
def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)

    user = repo.get_by_reset_token(token)

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    repo.update_password(user=user, new_password=new_password)

    return {"message": "Password updated successfully"}


# ==================================================
# CURRENT USER
# ==================================================

@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return UserRead.from_orm(current_user)


@router.patch("/me/user-type")
def update_user_type(
    payload: UserTypeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    allowed_user_types = {"student", "freelancer", "professional", "organisation"}
    requested_type = (payload.user_type or "").strip().lower()

    if requested_type not in allowed_user_types:
        raise HTTPException(status_code=400, detail="Invalid user type")

    repo = UserRepository(db)
    user = repo.update_user_type(user=current_user, user_type=requested_type)
    return UserRead.from_orm(user)
