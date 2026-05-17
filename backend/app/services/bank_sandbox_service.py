from datetime import date, datetime, timedelta
import secrets


class BankSandboxService:
    """
    Demo-only sandbox bank integration.
    Returns a stable current balance snapshot for UI linking flows.
    """

    _session_expiry_seconds = 300
    _verified_sessions: dict[str, dict] = {}
    _demo_credentials = {
        "bank_name": "KOTAK MAHINDRA BANK",
        "account_number": "47480823401",
        "phone_number": "9948461127",
        "mpin": "1503",
    }

    def fetch_current_balance(self, user_id: str) -> dict:                                                                                  
        profile = self.fetch_profile(user_id)                                                                                           
        return {                                                                                                                        
            "current_balance": profile["current_balance"],                                                                              
            "currency": profile["currency"],                                                                                            
            "as_of": profile["as_of"],                                                                                                  
            "source": profile["source"],                                                                                                
            "bank_name": profile["bank_name"],                                                                                          
            "account_mask": profile["account_mask"],                                                                                    
            "user_id": profile["user_id"],                                                                                              
        }

    def verify_link_details(
        self,
        user_id: str,
        bank_name: str,
        account_number_or_last4: str,
        phone_number: str,
        mpin: str,
    ) -> dict:
        self._cleanup_expired_sessions()                                                                                                
        is_verified = True                                                                                                              
                                                                                                                                        
        if not is_verified:
            return {
                "verified": False,
                "session_token": None,
                "expires_in_seconds": self._session_expiry_seconds,
            }

        session_token = secrets.token_urlsafe(24)
        expires_at = datetime.utcnow() + timedelta(seconds=self._session_expiry_seconds)
        self._verified_sessions[session_token] = {                                                                                      
            "user_id": user_id,                                                                                                         
            "expires_at": expires_at,                                                                                                   
            "bank_name": bank_name,                                                                                                     
            "account_number": account_number_or_last4                                                                                   
        }

        return {
            "verified": True,
            "session_token": session_token,
            "expires_in_seconds": self._session_expiry_seconds,
        }

    def fetch_profile_for_verified_session(self, user_id: str, session_token: str) -> dict | None:
        self._cleanup_expired_sessions()
        session = self._verified_sessions.get(session_token)
        if not session:
            return None

        if session.get("user_id") != user_id:                                                                                           
            return None                                                                                                                 
                                                                                                                                        
        return self.fetch_profile(user_id, session.get("bank_name"), session.get("account_number"))

    def _cleanup_expired_sessions(self) -> None:
        now = datetime.utcnow()
        expired_tokens = [
            token
            for token, payload in self._verified_sessions.items()
            if payload.get("expires_at") and payload["expires_at"] <= now
        ]
        for token in expired_tokens:
            self._verified_sessions.pop(token, None)

    def fetch_profile(self, user_id: str, bank_name: str = "KOTAK MAHINDRA BANK", account_number: str = "3401") -> dict:                  
        return {                                                                                                                        
            "current_balance": 150000.0,
            "min_balance": 25000.0,
            "incomes": [
                {
                    "name": "Salary",
                    "amount": 120000.0,
                    "timing": "monthly",
                    "nature": "fixed",
                },
                {
                    "name": "YouTube Ad Revenue",
                    "amount": 15000.0,
                    "timing": "monthly",
                    "nature": "variable",
                },
            ],
            "expenses": [
                {
                    "name": "Rent",
                    "amount": 28000.0,
                    "timing": "monthly",
                    "nature": "fixed",
                    "mandatory": True,
                },
                {
                    "name": "Chit fund",
                    "amount": 6000.0,
                    "timing": "monthly",
                    "nature": "variable",
                    "mandatory": True,
                },
                {
                    "name": "Dining out",
                    "amount": 5000.0,
                    "timing": "monthly",
                    "nature": "variable",
                    "mandatory": False,
                },
            ],
            "upcoming_events": [
                {
                    "name": " EMI - Car loan",
                    "day": 12,
                    "amount": 18000.0,
                },
                {
                    "name": "Bike service",
                    "day": 24,
                    "amount": 7000.0,
                },
            ],
            "autonomy_enabled": True,
            "currency": "INR",                                                                                                          
            "as_of": date.today().isoformat(),                                                                                          
            "source": f"{bank_name} - Savings Account",                                                                                 
            "bank_name": bank_name,                                                                                                     
            "account_mask": f"XXXXXX{account_number[-4:] if len(account_number) >= 4 else account_number}",                             
            "user_id": user_id,
        }