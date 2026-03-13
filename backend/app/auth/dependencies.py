from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.jwt_utils import decode_token
from app.auth.user_repo import UserRepository


# --------------------------------------------------
# OAuth2 Bearer Scheme (Swagger-compatible)
# --------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# --------------------------------------------------
# Get Current Authenticated User
# --------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Validates JWT and returns authenticated user.
    Automatically integrates with Swagger Authorize button.
    """

    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    repo = UserRepository(db)
    user = repo.get_by_email(payload.get("email"))

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    return user
