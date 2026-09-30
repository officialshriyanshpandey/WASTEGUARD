from datetime import datetime

from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    priority: str = Field(default="medium")
    description: str = Field(min_length=8, max_length=1000)
    location_address: str = Field(min_length=2, max_length=180)
    latitude: float | None = None
    longitude: float | None = None
    photo_url: str | None = None
    pickup_requested: bool = False


class ComplaintStatusUpdate(BaseModel):
    status: str


class ComplaintAssignment(BaseModel):
    worker_id: str


class ResolutionUpdate(BaseModel):
    resolution_note: str = Field(min_length=3, max_length=500)


class ComplaintOut(BaseModel):
    id: str
    category: str
    priority: str
    description: str
    location_address: str
    latitude: float | None = None
    longitude: float | None = None
    photo_url: str | None = None
    pickup_requested: bool
    status: str
    citizen_id: str
    citizen_name: str
    assigned_worker_id: str | None = None
    assigned_worker_name: str | None = None
    resolution_note: str | None = None
    created_at: datetime
    updated_at: datetime


class PickupCreate(BaseModel):
    item_type: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=2, max_length=180)
    preferred_date: str
    notes: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PickupOut(BaseModel):
    id: str
    citizen_id: str
    citizen_name: str
    item_type: str
    address: str
    preferred_date: str
    notes: str | None = None
    status: str
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime


class WorkerOut(BaseModel):
    id: str
    name: str
    email: str
    vehicle: str
    active: bool


class MetricsOut(BaseModel):
    total_reports: int
    pending: int
    in_progress: int
    resolved: int
    high_risk: int
    open_pickups: int
