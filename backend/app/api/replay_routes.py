# app/api/replay_routes.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.services.replay_service import ReplayService

from app.auth.dependencies import get_current_user
from app.auth.models import User


router = APIRouter(
    prefix="/api/runs",
    tags=["Replay"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{run_id}/replay")
def replay_run(
    run_id: str,
    current_user: User = Depends(get_current_user),  # ✅ AUTH
    db: Session = Depends(get_db),
):
    """
    Deterministic replay of a single autonomy run.
    Only accessible by run owner.
    """

    service = ReplayService(db)

    return service.replay_run(
        run_id=run_id,
        user_id=current_user.id
    )
