# app/auth/user_repo.py

from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from app.auth.models import User
from app.auth.security import hash_password


RESET_TOKEN_EXPIRE_MINUTES = 30


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    # --------------------------------------------------
    # Getters
    # --------------------------------------------------

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    # --------------------------------------------------
    # Local User Creation
    # --------------------------------------------------

    def create_local_user(
        self,
        *,
        user_id: str,
        email: str,
        password: str,
        user_type: str = "professional"
    ) -> User:

        if self.get_by_email(email):
            raise ValueError("User already exists")

        db_user = User(
            id=user_id,
            email=email,
            provider="local",
            password_hash=hash_password(password),
            user_type=user_type,
            is_active=True,
        )

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        return db_user

    # --------------------------------------------------
    # OAuth User Creation
    # --------------------------------------------------

    def get_or_create_oauth_user(
        self,
        *,
        user_id: str,
        email: str,
        provider: str,
        user_type: str = "professional"
    ) -> User:

        existing = self.get_by_email(email)

        if existing:
            if existing.provider != provider:
                raise ValueError("Account exists with different provider")
            return existing

        db_user = User(
            id=user_id,
            email=email,
            provider=provider,
            password_hash=None,
            user_type=user_type,
            is_active=True,
        )

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        return db_user

    # --------------------------------------------------
    # Password Reset (Forgot Password Flow)
    # --------------------------------------------------

    def set_reset_token(self, *, email: str, token: str) -> None:
        user = self.get_by_email(email)
        if not user:
            return

        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(
            minutes=RESET_TOKEN_EXPIRE_MINUTES
        )

        self.db.commit()

    def get_by_reset_token(self, token: str) -> Optional[User]:
        user = (
            self.db.query(User)
            .filter(User.reset_token == token)
            .first()
        )

        if not user:
            return None

        # 🔐 Expiry enforcement
        if not user.reset_token_expiry:
            return None

        if user.reset_token_expiry < datetime.utcnow():
            return None

        return user

    def update_password(self, *, user: User, new_password: str) -> None:
        user.password_hash = hash_password(new_password)

        # 🔥 Invalidate token after use
        user.reset_token = None
        user.reset_token_expiry = None

        self.db.commit()

    def update_user_type(self, *, user: User, user_type: str) -> User:
        user.user_type = user_type
        self.db.commit()
        self.db.refresh(user)
        return user
