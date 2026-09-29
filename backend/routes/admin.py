from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from database import (
    get_user_by_token,
    get_all_users,
    get_user_basic,
    get_all_sessions,
    get_dashboard_stats,
    delete_user_admin,
    set_user_password_admin,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(authorization):
    """Resolve the caller and require the admin flag.

    401 if the bearer token is missing or invalid, 403 if the profile is a
    normal user. Returns the admin's own profile dict. The admin flag comes
    from the server-side token lookup, never from anything the client sends.
    """
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


class PasswordResetRequest(BaseModel):
    password: str


@router.get("/users")
async def list_users(authorization: str = Header(None)):
    """Every profile with its session count and admin flag."""
    require_admin(authorization)
    return {"users": get_all_users()}


@router.get("/stats")
async def stats(authorization: str = Header(None)):
    """Platform totals for the admin overview cards."""
    require_admin(authorization)
    users = get_all_users()
    return {
        "total_users": len(users),
        "total_admins": sum(1 for u in users if u.get("is_admin")),
        "total_sessions": sum(int(u.get("session_count") or 0) for u in users),
    }


@router.get("/users/{user_id}/sessions")
async def user_sessions(user_id: int, authorization: str = Header(None)):
    """A specific profile with its sessions and aggregated dashboard stats."""
    require_admin(authorization)
    target = get_user_basic(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user": target,
        "sessions": get_all_sessions(user_id),
        "stats": get_dashboard_stats(user_id),
    }


@router.post("/users/{user_id}/password")
async def reset_password(
    user_id: int, req: PasswordResetRequest, authorization: str = Header(None)
):
    """Set a new password for any profile and log that profile out everywhere."""
    require_admin(authorization)
    try:
        ok = set_user_password_admin(user_id, req.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, authorization: str = Header(None)):
    """Delete any profile except the acting admin's own account."""
    admin = require_admin(authorization)
    if admin["id"] == user_id:
        raise HTTPException(
            status_code=400, detail="You cannot delete your own admin account."
        )
    if not delete_user_admin(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": True}

