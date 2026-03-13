# FinPilot

FinPilot is a full-stack autonomous finance system with:
- A **FastAPI backend** that runs a multi-agent financial decision cycle.
- A **Next.js frontend** that handles auth, setup, run execution, replay, dashboard, and investment views.

---

## 1) Architecture (High-Level)

### Backend (`backend/`)
- API server: `backend/app/main.py`
- Core orchestration graph: `backend/app/orchestrator/graph.py`
- Agent nodes and logic: `backend/app/agents/`
- Persistence: SQLite via SQLAlchemy (`backend/app/db/`)
- Auth: JWT + optional Google OAuth (`backend/app/auth/`)

### Frontend (`frontend/`)
- Framework: Next.js App Router
- API client: `frontend/services/api.ts`
- Auth/session context: `frontend/context/AuthContext.tsx`
- Core pages: landing (`/`), auth (`/auth`), setup (`/setup`), dashboard (`/dashboard`), runs/replay/investments/logs/settings

---

## 2) Prerequisites

- **Python** 3.11.x
- **Node.js** 20+ (recommended)
- **npm** (comes with Node)
- OS: Windows/macOS/Linux (commands below include Windows PowerShell examples)

---

## 3) Environment Variables

## Backend env (`.env` in repo root)

Create `.env` at project root (you can start from `example.env`):

```env
OPENROUTER_API_KEY=
JWT_SECRET_KEY=replace_with_long_random_secret
JWT_EXPIRE_HOURS=24
GOOGLE_CLIENT_ID=
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENV=local
```

Notes:
- `JWT_SECRET_KEY` is required for auth token creation/validation.
- `OPENROUTER_API_KEY` is optional (LLM advice gracefully falls back when missing).
- `GOOGLE_CLIENT_ID` is required only if you want Google sign-in.

## Frontend env (`frontend/.env.local`)

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Notes:
- `NEXT_PUBLIC_API_URL` should point to running backend.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` should match backend `GOOGLE_CLIENT_ID` when Google login is enabled.

---

## 4) Step-by-Step Run (Local Development)

Use **two terminals**.

## Step A — Install Python dependencies

From project root:

```powershell
python -m venv venv
& .\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

## Step B — Start backend (Terminal 1)

```powershell
& .\venv\Scripts\Activate.ps1
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected backend status:
- API root: `http://localhost:8000/`
- Health: `http://localhost:8000/health`
- Swagger docs: `http://localhost:8000/docs`

On first startup, tables are auto-created by `init_db()` and SQLite DB is used.

## Step C — Install frontend dependencies

In another terminal:

```powershell
cd frontend
npm install
```

## Step D — Start frontend (Terminal 2)

```powershell
cd frontend
npm run dev
```

Expected frontend status:
- App: `http://localhost:3000`

---

## 5) Where the app should be running after setup

After finishing all steps:
- **Backend running on `:8000`**
	- `GET /health` returns status payload (`status`, `env`, `autonomy_enabled`).
	- Auth and autonomy APIs are available.
- **Frontend running on `:3000`**
	- Landing page at `/`
	- Login/register at `/auth`
	- After login, protected pages: `/dashboard`, `/setup`, `/runs`, `/investments`, `/logs`, `/settings`

If frontend cannot reach backend, check `NEXT_PUBLIC_API_URL` and CORS origins.

---

## 6) Core API Endpoints

### Public health
- `GET /`
- `GET /health`

### Auth (`/auth`)
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`
- `PATCH /auth/me/user-type`

### Autonomy / data (JWT required)
- `POST /run-autonomy-cycle`
- `GET /api/runs`
- `GET /api/runs/{run_id}/replay`
- `GET /api/ledger` (optional query `run_id`)
- `GET /api/dashboard/summary`
- `GET /api/investments`
- `POST /api/bank/sandbox-verify`
- `GET /api/bank/sandbox-balance`

---

## 7) Typical User Flow

1. Open `http://localhost:3000`
2. Register/login in `/auth`
3. Go to `/setup` and provide financial profile (manual or sandbox bank flow)
4. Run autonomy cycle
5. Review:
	 - `/dashboard` for summary
	 - `/runs` and `/replay/{runId}` for run history and replay
	 - `/investments` for holdings/performance
	 - `/logs` for ledger-oriented traces

---

## 8) Testing & Quality Checks

### Backend tests

```powershell
cd backend
pytest -q
```

### Frontend lint/build

```powershell
cd frontend
npm run lint
npm run build
```

---

## 9) Troubleshooting

### `401 Unauthorized` on protected APIs
- Ensure login happened and token exists in browser `localStorage` (`access_token`).
- Confirm `JWT_SECRET_KEY` in backend `.env` is set and stable across restarts.

### Google login fails
- Set both `GOOGLE_CLIENT_ID` (backend) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend).
- Ensure OAuth client in Google Console allows your local origin.

### Frontend loads but data calls fail
- Verify backend is running on port `8000`.
- Verify `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- Verify backend CORS includes frontend origin (`http://localhost:3000`).

### LLM output missing
- This is expected when `OPENROUTER_API_KEY` is not set or rate-limited; system falls back safely.

---

## 10) Notes for Development

- Backend DB uses SQLite (`ledger.db`) for local development.
- Orchestration graph enforces this flow:
	`perception -> prediction -> simulation -> decision -> guardrail -> reality_execution -> (autonomy gate) -> investment pipeline -> explanation`
- Investment execution in current code path is simulated/logged (not real broker execution).
