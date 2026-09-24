from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import (
    create_session,
    get_all_sessions,
    get_session_detail,
    get_dashboard_stats,
    delete_session,
    get_user_by_token,
)

router = APIRouter(prefix="/api", tags=["sessions"])


def require_user(authorization):
    """Resolve the caller from their bearer token; 401 if missing or invalid.

    The user id comes from the server-side token, never from a value the client
    claims, so one profile cannot reach another's data by supplying an id.
    """
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")
    return user["id"]


class CreateSessionRequest(BaseModel):
    topic: str
    difficulty: str = "Fresher"


# --- Sessions (scoped to the authenticated profile) ---

@router.post("/sessions")
async def create(req: CreateSessionRequest, authorization: str = Header(None)):
    user_id = require_user(authorization)
    session_id = create_session(req.topic, req.difficulty, user_id)
    return {"session_id": session_id}


@router.get("/sessions")
async def list_sessions(authorization: str = Header(None)):
    user_id = require_user(authorization)
    return {"sessions": get_all_sessions(user_id)}


@router.get("/sessions/{session_id}")
async def detail(session_id: int, authorization: str = Header(None)):
    user_id = require_user(authorization)
    session = get_session_detail(session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}")
async def remove(session_id: int, authorization: str = Header(None)):
    user_id = require_user(authorization)
    deleted = delete_session(session_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}


@router.get("/dashboard")
async def dashboard(authorization: str = Header(None)):
    user_id = require_user(authorization)
    return get_dashboard_stats(user_id)
