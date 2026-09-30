from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


Severity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
AnalysisMode = Literal["real_ai", "demo_fallback"]


class AIAnalysisRequest(BaseModel):
    image_base64: str = Field(min_length=100, max_length=8_000_000)
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]


class AIAnalysisResult(BaseModel):
    detected_issue: str
    waste_type: str
    severity: Severity
    estimated_fill_level: int = Field(ge=0, le=100)
    recommended_action: str
    confidence: int = Field(ge=0, le=100)
    analysis_mode: AnalysisMode
    disclaimer: str


class SmartReportCreate(BaseModel):
    location_address: str = Field(min_length=2, max_length=180)
    area: str = Field(default="Area A", min_length=2, max_length=80)
    description: str = Field(default="", max_length=1000)
    latitude: float | None = None
    longitude: float | None = None
    image_data_url: str = Field(min_length=100, max_length=8_000_000)
    analysis: AIAnalysisResult


class TimelineEvent(BaseModel):
    label: str
    at: datetime


class WasteReportOut(BaseModel):
    id: str
    complaint_code: str
    citizen_id: str
    citizen_name: str
    detected_issue: str
    waste_type: str
    severity: Severity
    estimated_fill_level: int
    recommended_action: str
    ai_confidence: int
    analysis_mode: AnalysisMode
    location_address: str
    area: str
    description: str
    latitude: float | None = None
    longitude: float | None = None
    before_image: str | None = None
    after_image: str | None = None
    status: str
    assigned_worker_id: str | None = None
    assigned_worker_name: str | None = None
    assigned_vehicle: str | None = None
    verification_status: str
    resolution_note: str | None = None
    timeline: list[TimelineEvent]
    created_at: datetime
    updated_at: datetime


class AssignReportRequest(BaseModel):
    worker_id: str


class CleanupEvidenceRequest(BaseModel):
    before_image: str = Field(min_length=100, max_length=8_000_000)
    after_image: str = Field(min_length=100, max_length=8_000_000)
    resolution_note: str = Field(min_length=3, max_length=500)


class MetricsOut(BaseModel):
    total_reports: int
    pending: int
    resolved: int
    high_risk_areas: int
    active_workers: int


class HotspotOut(BaseModel):
    area: str
    risk_level: str
    risk_score: int
    predicted_overflow_hours: int
    complaints: int
    missed_pickups: int
    recommended_action: str
    latitude: float
    longitude: float
    demo_simulated: bool = True


class RouteStop(BaseModel):
    label: str
    area: str
    severity: str
    latitude: float
    longitude: float


class SmartRouteOut(BaseModel):
    traditional_distance_km: float
    optimized_distance_km: float
    saved_distance_km: float
    stops: list[RouteStop]
    demo_simulated: bool = True


class RewardSummary(BaseModel):
    points: int
    badges: list[str]
    rank: int


class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    read: bool
    created_at: datetime
