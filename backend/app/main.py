from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os

# Load environment variables before importing env-dependent modules
ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ROOT_ENV)

from app.config.settings import settings
# Routers
from app.api.run_cycle import router as run_cycle_router
from app.api.run_routes import router as runs_router
from app.api.replay_routes import router as replay_router
from app.api.ledger_routes import router as ledger_router
from app.auth.auth_routes import router as auth_router  # ✅ ADD THIS
from app.db.init_db import init_db
from app.api.dashboard import router as dashboard
from app.api.investments import router as investments
from app.api.bank_sandbox import router as bank_sandbox

app = FastAPI(
    title=settings.APP_NAME,
    description="Autonomous Personal Finance System (FinPilot)",
    version="1.0.0"
)


def _resolve_cors_origins() -> list[str]:
    # Allow comma-separated origins from env while keeping local/dev defaults.
    default_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://app.finpilot360.xyz",
    ]
    raw = os.getenv("CORS_ORIGINS", "").strip()

    if not raw:
        return default_origins

    parsed = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return parsed or default_origins

# --------------------
# CORS Configuration
# --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=_resolve_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ✅ Initialize DB on startup
@app.on_event("startup")
def on_startup():
    init_db()


# --------------------
# Root
# --------------------
@app.get("/")
def root():
    return {
        "message": "FinPilot API is running",
        "docs": "/docs",
        "health": "/health"
    }

# --------------------
# Register Routers
# --------------------
app.include_router(auth_router)        
app.include_router(run_cycle_router)
app.include_router(runs_router)
app.include_router(replay_router)
app.include_router(ledger_router)
app.include_router(dashboard)
app.include_router(investments)
app.include_router(bank_sandbox)

# ❌ REMOVE DEV AUTH MIDDLEWARE
# app.middleware("http")(dev_auth_middleware)

# --------------------
# Health & Readiness
# --------------------
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "env": settings.ENV,
        "autonomy_enabled": settings.ENABLE_AUTONOMY
    }
