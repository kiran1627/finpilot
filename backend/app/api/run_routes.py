# app/api/run_routes.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.database import SessionLocal
from app.services.run_service import RunService

from app.auth.dependencies import get_current_user
from app.auth.models import User


router = APIRouter(
    prefix="/api/runs",
    tags=["Runs"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=List[Dict[str, Any]])
def list_runs(
    current_user: User = Depends(get_current_user),  # ✅ AUTH
    db: Session = Depends(get_db),
):
    """
    List autonomy runs for authenticated user only.
    """

    service = RunService(db)

    return service.list_runs(user_id=current_user.id)
