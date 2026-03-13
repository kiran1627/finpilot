from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.services.bank_sandbox_service import BankSandboxService

router = APIRouter()


class SandboxVerifyRequest(BaseModel):
    bank_name: str = Field(min_length=3)
    account_number_or_last4: str = Field(min_length=4, max_length=18)
    phone_number: str = Field(min_length=10, max_length=10)
    mpin: str = Field(min_length=4, max_length=6)


@router.post("/api/bank/sandbox-verify")
def verify_sandbox_bank(
    payload: SandboxVerifyRequest,
    current_user: User = Depends(get_current_user),
):
    service = BankSandboxService()
    result = service.verify_link_details(
        user_id=current_user.id,
        bank_name=payload.bank_name,
        account_number_or_last4=payload.account_number_or_last4,
        phone_number=payload.phone_number,
        mpin=payload.mpin,
    )

    if not result["verified"]:
        raise HTTPException(status_code=401, detail="Verification failed")

    return result


@router.get("/api/bank/sandbox-balance")
def get_sandbox_balance(
    session_token: str = Query(..., min_length=8),
    current_user: User = Depends(get_current_user),
):
    service = BankSandboxService()
    profile = service.fetch_profile_for_verified_session(
        user_id=current_user.id,
        session_token=session_token,
    )
    if not profile:
        raise HTTPException(status_code=401, detail="Verification session invalid or expired")

    return {
        "current_balance": profile["current_balance"],
        "min_balance": profile["min_balance"],
        "incomes": profile["incomes"],
        "expenses": profile["expenses"],
        "upcoming_events": profile["upcoming_events"],
        "autonomy_enabled": profile["autonomy_enabled"],
        "currency": profile["currency"],
        "as_of": profile["as_of"],
        "source": profile["source"],
        "bank_name": profile["bank_name"],
        "account_mask": profile["account_mask"],
    }