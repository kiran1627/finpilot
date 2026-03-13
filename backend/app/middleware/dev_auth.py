from fastapi import Request

async def dev_auth_middleware(request: Request, call_next):
    # DEV ONLY — simulates authenticated user
    request.state.user_id = "user-123"
    response = await call_next(request)
    return response
