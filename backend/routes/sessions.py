from fastapi import APIRouter, HTTPException
from database import create_session, get_all_sessions, get_session_detail, get_dashboard_stats, delete_session
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["sessions"])


class CreateSessionRequest(BaseModel):
    topic: str
    difficulty: str = "Fresher"


@router.post("/sessions")
async def create(req: CreateSessionRequest):
    session_id = create_session(req.topic, req.difficulty)
    return {"session_id": session_id}


@router.get("/sessions")
async def list_sessions():
    return {"sessions": get_all_sessions()}


@router.get("/sessions/{session_id}")
async def detail(session_id: int):
    session = get_session_detail(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}")
async def remove(session_id: int):
    deleted = delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}


@router.get("/dashboard")
async def dashboard():
    return get_dashboard_stats()
