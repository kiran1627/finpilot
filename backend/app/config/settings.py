from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "FinPilot"
    ENV: str = "local"

    ENABLE_AUTONOMY: bool = True
    ENABLE_AUDIT_PERSISTENCE: bool = True

    DATA_PATH: str = "app/data/"
    STORAGE_PATH: str = "app/storage/"

    JWT_SECRET_KEY: Optional[str] = None
    JWT_EXPIRE_HOURS: int = 24
    GOOGLE_CLIENT_ID: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
