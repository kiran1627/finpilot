from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.investment_service import InvestmentService
from app.auth.dependencies import get_current_user

router = APIRouter()


@router.get("/api/investments")
def get_investments(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    service = InvestmentService(db)
    return service.get_investments(user.id)
