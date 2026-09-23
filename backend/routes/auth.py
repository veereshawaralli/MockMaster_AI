from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from database import (
    register_user,
    verify_login,
    create_token,
    delete_token,
    get_user_by_token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthRequest(BaseModel):
    name: str
    password: str


def _bearer(authorization):
    """Pull the raw token out of an 'Authorization: Bearer <token>' header."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    return authorization[7:].strip()


@router.post("/register")
async def register(req: AuthRequest):
    try:
        user = register_user(req.name, req.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = create_token(user["id"])
    return {"token": token, "user": user}


@router.post("/login")
async def login(req: AuthRequest):
    try:
        user = verify_login(req.name, req.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect name or password")
    token = create_token(user["id"])
    return {"token": token, "user": user}


@router.get("/me")
async def me(authorization: str = Header(None)):
    user = get_user_by_token(_bearer(authorization))
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.post("/logout")
async def logout(authorization: str = Header(None)):
    delete_token(_bearer(authorization))
    return {"ok": True}
