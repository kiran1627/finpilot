# app/auth/schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional


# --------------------------------------------------
# Base
# --------------------------------------------------

class UserBase(BaseModel):
    email: EmailStr


# --------------------------------------------------
# Register (LOCAL)
# --------------------------------------------------

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    user_type: Optional[str] = "professional"


# --------------------------------------------------
# Login (LOCAL)
# --------------------------------------------------

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# --------------------------------------------------
# OAuth (Google)
# --------------------------------------------------

class OAuthPayload(BaseModel):
    id_token: str


# --------------------------------------------------
# DB Create Schema (Internal Only)
# --------------------------------------------------

class UserCreate(BaseModel):
    id: str
    email: EmailStr
    provider: str
    password_hash: Optional[str] = None
    user_type: Optional[str] = "professional"


# --------------------------------------------------
# JWT Response
# --------------------------------------------------

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str


# --------------------------------------------------
# User Read Response
# --------------------------------------------------

class UserRead(BaseModel):
    id: str
    email: EmailStr
    provider: str
    user_type: str

    class Config:
        from_attributes = True

# --------------------------------------------------
# Forgot Password
# --------------------------------------------------

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class UserTypeUpdate(BaseModel):
    user_type: str
