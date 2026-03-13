import jwt
from datetime import datetime, timedelta
from typing import Dict, Any
from app.config.settings import settings

# --------------------------------------------------
# Configuration (MUST come from environment)
# --------------------------------------------------

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = settings.JWT_EXPIRE_HOURS


def _get_secret_key() -> str:
    if not settings.JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY not set in environment")
    return settings.JWT_SECRET_KEY


# --------------------------------------------------
# Create Token
# --------------------------------------------------

def create_access_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    return jwt.encode(to_encode, _get_secret_key(), algorithm=ALGORITHM)


# --------------------------------------------------
# Decode Token
# --------------------------------------------------

def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            _get_secret_key(),
            algorithms=[ALGORITHM]
        )

        if payload.get("type") != "access":
            raise jwt.InvalidTokenError("Invalid token type")

        return payload

    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")

    except jwt.InvalidTokenError:
        raise Exception("Invalid token")
