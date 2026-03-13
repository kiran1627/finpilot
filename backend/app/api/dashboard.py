from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.dashboard_service import DashboardService
from app.auth.dependencies import get_current_user

router = APIRouter()


@router.get("/api/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    service = DashboardService(db)
    return service.get_summary(user.id)
