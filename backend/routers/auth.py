from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.auth import create_access_token, get_current_user, get_optional_user, hash_password, public_user, verify_password
from lib.db import db
from models.auth import AuthResponse, LoginRequest, RegisterRequest, SwitchRoleRequest, UserPublic


router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session(response: Response, user_id: str, request: Request) -> None:
    response.set_cookie(
        key="access_token",
        value=create_access_token(user_id),
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        max_age=43200,
        path="/",
    )


@router.post("/register", response_model=AuthResponse)
async def register(input: RegisterRequest, response: Response, request: Request):
    email = input.email.strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": input.name.strip(),
        "role": input.role,
        "password_hash": hash_password(input.password),
        "vehicle": "Eco Van 12" if input.role == "worker" else "",
        "active": input.role == "worker",
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user)
    _set_session(response, user["id"], request)
    return {"user": public_user(user)}


@router.post("/login", response_model=AuthResponse)
async def login(input: LoginRequest, response: Response, request: Request):
    user = await db.users.find_one({"email": input.email.strip().lower()})
    if not user or not verify_password(input.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    _set_session(response, user["id"], request)
    return {"user": public_user(user)}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out"}


@router.post("/switch-role", response_model=AuthResponse)
async def switch_role(input: SwitchRoleRequest, response: Response, request: Request, user: dict = Depends(get_current_user)):
    """Switch between the three seeded workspace personas without a second sign-in."""
    demo_emails = {
        "citizen": "citizen@example.com",
        "worker": "worker@example.com",
        "admin": "admin@example.com",
    }
    demo_user = await db.users.find_one({"email": demo_emails[input.role]})
    if not demo_user:
        raise HTTPException(status_code=404, detail="Demo workspace is not available")
    _set_session(response, demo_user["id"], request)
    return {"user": public_user(demo_user)}


@router.get("/me", response_model=UserPublic | None)
async def me(user: dict | None = Depends(get_optional_user)):
    return public_user(user) if user else None


async def seed_demo_accounts() -> None:
    accounts = [
        ("admin@example.com", "admin123", "Aarav Mehta", "admin", ""),
        ("worker@example.com", "worker123", "Ravi Kumar", "worker", "Truck 03"),
        ("citizen@example.com", "citizen123", "Priya Sharma", "citizen", ""),
    ]
    for email, password, name, role, vehicle in accounts:
        existing = await db.users.find_one({"email": email})
        if existing:
            await db.users.update_one(
                {"id": existing["id"]},
                {"$set": {"name": name, "role": role, "vehicle": vehicle, "active": True, "password_hash": hash_password(password)}},
            )
            continue
        await db.users.insert_one(
            {
                "id": str(uuid.uuid4()),
                "email": email,
                "name": name,
                "role": role,
                "vehicle": vehicle,
                "active": True,
                "password_hash": hash_password(password),
                "created_at": datetime.now(timezone.utc),
            }
        )
