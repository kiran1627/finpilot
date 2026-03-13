# app/api/ledger_routes.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.db.database import SessionLocal
from app.db.ledger_repo import LedgerDBRepository

from app.auth.dependencies import get_current_user
from app.auth.models import User


router = APIRouter(
    prefix="/api/ledger",
    tags=["Ledger"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=List[Dict[str, Any]])
def get_ledger(
    run_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),  # ✅ AUTH
    db: Session = Depends(get_db),
):
    """
    Append-only ledger view for authenticated user.
    """

    repo = LedgerDBRepository(db)

    if run_id:
        entries = repo.get_by_run_id(
            run_id=run_id,
            user_id=current_user.id
        )
    else:
        entries = repo.get_all_for_user(user_id=current_user.id)


    return [
        {
            "entry_type": e.entry_type,
            "payload": e.payload,
            "run_id": e.run_id,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]
