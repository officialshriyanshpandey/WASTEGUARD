from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


Role = Literal["citizen", "worker", "admin"]


class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: Role
    created_at: datetime


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str
    password: str = Field(min_length=6, max_length=120)
    role: Literal["citizen", "worker"] = "citizen"


class LoginRequest(BaseModel):
    email: str
    password: str


class SwitchRoleRequest(BaseModel):
    role: Literal["citizen", "worker", "admin"]


class AuthResponse(BaseModel):
    user: UserPublic
