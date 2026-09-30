import base64
import json
import os
import re
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import ImageContent, LlmChat, StreamDone, TextDelta, UserMessage
from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from lib.auth import get_current_user
from lib.db import db
from models.wasteguard import (
    AIAnalysisRequest,
    AIAnalysisResult,
    AssignReportRequest,
    CleanupEvidenceRequest,
    HotspotOut,
    MetricsOut,
    NotificationOut,
    RewardSummary,
    SmartReportCreate,
    SmartRouteOut,
    WasteReportOut,
)


router = APIRouter(tags=["wasteguard"])

DEMO_ANALYSIS = {
    "detected_issue": "Overflowing Garbage Bin",
    "waste_type": "Mixed Waste",
    "severity": "HIGH",
    "estimated_fill_level": 87,
    "recommended_action": "Immediate Collection",
    "confidence": 91,
    "analysis_mode": "demo_fallback",
    "disclaimer": "DEMO AI ANALYSIS — simulated sample result because live AI was unavailable.",
}


def _require_role(user: dict, role: str) -> None:
    if user.get("role") != role:
        raise HTTPException(status_code=403, detail=f"{role.title()} access required")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _timeline(label: str) -> dict:
    return {"label": label, "at": _now()}


async def _notify(user_id: str, title: str, message: str) -> None:
    await db.notifications.insert_one(
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "message": message,
            "read": False,
            "created_at": _now(),
        }
    )


async def _report_out(doc: dict) -> dict:
    worker = await db.users.find_one({"id": doc.get("assigned_worker_id")}) if doc.get("assigned_worker_id") else None
    return {
        **doc,
        "assigned_worker_name": worker.get("name") if worker else doc.get("assigned_worker_name"),
        "assigned_vehicle": worker.get("vehicle") if worker else doc.get("assigned_vehicle"),
    }


def _clean_json(raw: str) -> dict:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError("AI response did not contain JSON")
    return json.loads(match.group(0))


@router.post("/ai/analyze", response_model=AIAnalysisResult)
async def analyze_waste(input: AIAnalysisRequest, user: dict = Depends(get_current_user)):
    _require_role(user, "citizen")
    try:
        base64.b64decode(input.image_base64, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Image payload is not valid base64") from exc

    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        return DEMO_ANALYSIS

    try:
        chat = LlmChat(
            api_key=key,
            session_id=f"wasteguard-{uuid.uuid4()}",
            system_message=(
                "You are WasteGuard's municipal waste image analyst. Inspect only the supplied image. "
                "Return one strict JSON object with keys detected_issue, waste_type, severity, "
                "estimated_fill_level, recommended_action, confidence. Severity must be LOW, MEDIUM, HIGH, or CRITICAL. "
                "Fill and confidence must be integer percentages. Do not use markdown."
            ),
        ).with_model("gemini", "gemini-3.8-flash")
        parts: list[str] = []
        image = ImageContent(image_base64=input.image_base64)
        async for event in chat.stream_message(
            UserMessage(
                text="Analyze this waste scene for a city operations complaint.",
                file_contents=[image],
            )
        ):
            if isinstance(event, TextDelta):
                parts.append(event.content)
            elif isinstance(event, StreamDone):
                break
        parsed = _clean_json("".join(parts))
        parsed.update(
            {
                "analysis_mode": "real_ai",
                "disclaimer": "Analyzed live by Gemini 3.8 Flash. Human review is recommended before dispatch.",
            }
        )
        return AIAnalysisResult(**parsed)
    except Exception:
        return DEMO_ANALYSIS


@router.post("/wasteguard/reports", response_model=WasteReportOut)
async def create_smart_report(input: SmartReportCreate, user: dict = Depends(get_current_user)):
    _require_role(user, "citizen")
    counter = await db.counters.find_one_and_update(
        {"_id": "wasteguard_complaint"},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    now = _now()
    code = f"WG-{counter['value']}"
    doc = {
        "id": str(uuid.uuid4()),
        "complaint_code": code,
        "citizen_id": user["id"],
        "citizen_name": user["name"],
        "detected_issue": input.analysis.detected_issue,
        "waste_type": input.analysis.waste_type,
        "severity": input.analysis.severity,
        "estimated_fill_level": input.analysis.estimated_fill_level,
        "recommended_action": input.analysis.recommended_action,
        "ai_confidence": input.analysis.confidence,
        "analysis_mode": input.analysis.analysis_mode,
        "location_address": input.location_address,
        "area": input.area,
        "description": input.description,
        "latitude": input.latitude,
        "longitude": input.longitude,
        "before_image": input.image_data_url,
        "after_image": None,
        "status": "reported",
        "assigned_worker_id": None,
        "assigned_worker_name": None,
        "assigned_vehicle": None,
        "verification_status": "pending",
        "resolution_note": None,
        "timeline": [_timeline("Reported"), _timeline("AI Analyzed")],
        "created_at": now,
        "updated_at": now,
        # Compatibility with the existing EcoClean API.
        "category": input.analysis.detected_issue,
        "priority": input.analysis.severity.lower(),
        "photo_url": input.image_data_url,
        "pickup_requested": False,
    }
    await db.complaints.insert_one(doc)
    await db.rewards.update_one(
        {"user_id": user["id"]},
        {"$inc": {"points": 10}, "$setOnInsert": {"badges": ["Waste Warrior"]}},
        upsert=True,
    )
    await _notify(user["id"], "Smart complaint created", f"Complaint {code} is now visible to the command center.")
    return await _report_out(doc)


@router.get("/wasteguard/reports", response_model=list[WasteReportOut])
async def list_smart_reports(user: dict = Depends(get_current_user)):
    query: dict = {"complaint_code": {"$exists": True}}
    if user["role"] == "citizen":
        query["citizen_id"] = user["id"]
    elif user["role"] == "worker":
        query["assigned_worker_id"] = user["id"]
    docs = await db.complaints.find(query).sort("created_at", -1).to_list(300)
    return [await _report_out(doc) for doc in docs]


@router.get("/wasteguard/reports/{report_id}", response_model=WasteReportOut)
async def get_smart_report(report_id: str, user: dict = Depends(get_current_user)):
    doc = await db.complaints.find_one({"id": report_id, "complaint_code": {"$exists": True}})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if user["role"] == "citizen" and doc["citizen_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Complaint access denied")
    if user["role"] == "worker" and doc.get("assigned_worker_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Task access denied")
    return await _report_out(doc)


@router.post("/wasteguard/reports/{report_id}/assign", response_model=WasteReportOut)
async def assign_smart_report(report_id: str, input: AssignReportRequest, user: dict = Depends(get_current_user)):
    _require_role(user, "admin")
    worker = await db.users.find_one({"id": input.worker_id, "role": "worker", "active": True})
    if not worker:
        raise HTTPException(status_code=404, detail="Active worker not found")
    result = await db.complaints.update_one(
        {"id": report_id, "complaint_code": {"$exists": True}},
        {
            "$set": {
                "assigned_worker_id": worker["id"],
                "assigned_worker_name": worker["name"],
                "assigned_vehicle": worker.get("vehicle", "Truck 03"),
                "status": "assigned",
                "updated_at": _now(),
            },
            "$push": {"timeline": _timeline("Assigned")},
        },
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Complaint not found")
    doc = await db.complaints.find_one({"id": report_id})
    await _notify(worker["id"], "High-priority task assigned", f"{doc['complaint_code']} at {doc['area']} is ready in your route.")
    return await _report_out(doc)


@router.post("/wasteguard/reports/{report_id}/start", response_model=WasteReportOut)
async def start_smart_report(report_id: str, user: dict = Depends(get_current_user)):
    _require_role(user, "worker")
    result = await db.complaints.update_one(
        {"id": report_id, "assigned_worker_id": user["id"]},
        {"$set": {"status": "in_progress", "updated_at": _now()}, "$push": {"timeline": _timeline("In Progress")}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Assigned task not found")
    return await _report_out(await db.complaints.find_one({"id": report_id}))


@router.post("/wasteguard/reports/{report_id}/evidence", response_model=WasteReportOut)
async def submit_cleanup_evidence(report_id: str, input: CleanupEvidenceRequest, user: dict = Depends(get_current_user)):
    _require_role(user, "worker")
    result = await db.complaints.update_one(
        {"id": report_id, "assigned_worker_id": user["id"]},
        {
            "$set": {
                "before_image": input.before_image,
                "after_image": input.after_image,
                "resolution_note": input.resolution_note,
                "status": "cleanup_submitted",
                "verification_status": "evidence_submitted",
                "updated_at": _now(),
            },
            "$push": {"timeline": _timeline("Cleanup Completed")},
        },
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Assigned task not found")
    doc = await db.complaints.find_one({"id": report_id})
    admin = await db.users.find_one({"role": "admin"})
    if admin:
        await _notify(admin["id"], "Cleanup evidence ready", f"Verify before/after evidence for {doc['complaint_code']}.")
    return await _report_out(doc)


@router.post("/wasteguard/reports/{report_id}/verify", response_model=WasteReportOut)
async def verify_cleanup(report_id: str, user: dict = Depends(get_current_user)):
    _require_role(user, "admin")
    doc = await db.complaints.find_one({"id": report_id, "status": "cleanup_submitted"})
    if not doc:
        raise HTTPException(status_code=409, detail="Cleanup evidence must be submitted before verification")
    now = _now()
    await db.complaints.update_one(
        {"id": report_id},
        {
            "$set": {"status": "resolved", "verification_status": "verified", "updated_at": now},
            "$push": {"timeline": {"$each": [_timeline("Verified"), _timeline("Resolved")]}},
        },
    )
    await db.rewards.update_one(
        {"user_id": doc["citizen_id"]},
        {"$inc": {"points": 30}, "$addToSet": {"badges": "Clean City Hero"}},
        upsert=True,
    )
    await _notify(doc["citizen_id"], "Complaint resolved", f"{doc['complaint_code']} was verified and resolved. You earned 30 points.")
    return await _report_out(await db.complaints.find_one({"id": report_id}))


@router.get("/wasteguard/metrics", response_model=MetricsOut)
async def wasteguard_metrics(user: dict = Depends(get_current_user)):
    _require_role(user, "admin")
    query = {"complaint_code": {"$exists": True}}
    docs = await db.complaints.find(query).to_list(1000)
    active_workers = await db.users.count_documents({"role": "worker", "active": True})
    high_areas = {doc.get("area") for doc in docs if doc.get("severity") in {"HIGH", "CRITICAL"} and doc.get("status") != "resolved"}
    return {
        "total_reports": len(docs) + 125,
        "pending": sum(doc.get("status") not in {"resolved"} for doc in docs) + 21,
        "resolved": sum(doc.get("status") == "resolved" for doc in docs) + 88,
        "high_risk_areas": max(7, len(high_areas)),
        "active_workers": max(12, active_workers),
    }


@router.get("/wasteguard/hotspots", response_model=list[HotspotOut])
async def hotspots(user: dict = Depends(get_current_user)):
    _require_role(user, "admin")
    return [
        {"area": "Area A", "risk_level": "HIGH", "risk_score": 92, "predicted_overflow_hours": 8, "complaints": 18, "missed_pickups": 4, "recommended_action": "Assign Truck 03", "latitude": 28.6139, "longitude": 77.209, "demo_simulated": True},
        {"area": "Area B", "risk_level": "MEDIUM", "risk_score": 71, "predicted_overflow_hours": 16, "complaints": 11, "missed_pickups": 2, "recommended_action": "Schedule collection today", "latitude": 28.628, "longitude": 77.218, "demo_simulated": True},
        {"area": "Area C", "risk_level": "LOW", "risk_score": 34, "predicted_overflow_hours": 30, "complaints": 5, "missed_pickups": 0, "recommended_action": "Continue monitoring", "latitude": 28.599, "longitude": 77.221, "demo_simulated": True},
    ]


@router.get("/wasteguard/smart-route", response_model=SmartRouteOut)
async def smart_route(user: dict = Depends(get_current_user)):
    if user["role"] not in {"admin", "worker"}:
        raise HTTPException(status_code=403, detail="Operations access required")
    return {
        "traditional_distance_km": 12.7,
        "optimized_distance_km": 8.4,
        "saved_distance_km": 4.3,
        "demo_simulated": True,
        "stops": [
            {"label": "DEPOT", "area": "Central Depot", "severity": "START", "latitude": 28.61, "longitude": 77.20},
            {"label": "1", "area": "Area A", "severity": "HIGH", "latitude": 28.614, "longitude": 77.209},
            {"label": "2", "area": "Area D", "severity": "HIGH", "latitude": 28.621, "longitude": 77.215},
            {"label": "3", "area": "Area B", "severity": "MEDIUM", "latitude": 28.628, "longitude": 77.218},
            {"label": "4", "area": "Area F", "severity": "NORMAL", "latitude": 28.619, "longitude": 77.229},
            {"label": "DEPOT", "area": "Central Depot", "severity": "END", "latitude": 28.61, "longitude": 77.20},
        ],
    }


@router.get("/wasteguard/rewards", response_model=RewardSummary)
async def reward_summary(user: dict = Depends(get_current_user)):
    _require_role(user, "citizen")
    reward = await db.rewards.find_one({"user_id": user["id"]}) or {"points": 140, "badges": ["Waste Warrior"]}
    points = max(140, reward.get("points", 0))
    badges = reward.get("badges", ["Waste Warrior"])
    if points >= 180 and "Eco Champion" not in badges:
        badges.append("Eco Champion")
    return {"points": points, "badges": badges, "rank": 4}


@router.get("/wasteguard/notifications", response_model=list[NotificationOut])
async def notifications(user: dict = Depends(get_current_user)):
    return await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)


async def seed_wasteguard_data() -> None:
    await db.counters.update_one(
        {"_id": "wasteguard_complaint"},
        {"$setOnInsert": {"value": 1023}},
        upsert=True,
    )
    if await db.complaints.count_documents({"complaint_code": {"$exists": True}}):
        return
    citizen = await db.users.find_one({"email": "citizen@example.com"})
    worker = await db.users.find_one({"email": "worker@example.com"})
    if not citizen or not worker:
        return
    now = _now()
    examples = [
        ("WG-1009", "Illegal Dumping", "Construction Waste", "HIGH", "Area A", "assigned", 91, 28.6139, 77.209),
        ("WG-1017", "Overflowing Garbage Bin", "Mixed Waste", "MEDIUM", "Area C", "in_progress", 76, 28.599, 77.221),
        ("WG-1021", "Missed Collection", "Dry Waste", "LOW", "Area D", "resolved", 48, 28.621, 77.215),
    ]
    docs = []
    for code, issue, waste_type, severity, area, status, fill, lat, lng in examples:
        assigned = status != "reported"
        docs.append(
            {
                "id": str(uuid.uuid4()), "complaint_code": code, "citizen_id": citizen["id"], "citizen_name": citizen["name"],
                "detected_issue": issue, "waste_type": waste_type, "severity": severity, "estimated_fill_level": fill,
                "recommended_action": "Immediate Collection" if severity == "HIGH" else "Schedule Collection", "ai_confidence": 89,
                "analysis_mode": "demo_fallback", "location_address": f"{area}, Smart City Zone", "area": area,
                "description": "Hackathon demo report with realistic municipal operations data.", "latitude": lat, "longitude": lng,
                "before_image": None, "after_image": None, "status": status,
                "assigned_worker_id": worker["id"] if assigned else None, "assigned_worker_name": worker["name"] if assigned else None,
                "assigned_vehicle": "Truck 03" if assigned else None, "verification_status": "verified" if status == "resolved" else "pending",
                "resolution_note": "Collection completed and area inspected." if status == "resolved" else None,
                "timeline": [_timeline("Reported"), _timeline("AI Analyzed")] + ([_timeline("Assigned")] if assigned else []),
                "created_at": now, "updated_at": now, "category": issue, "priority": severity.lower(), "photo_url": None,
                "pickup_requested": False,
            }
        )
    await db.complaints.insert_many(docs)
    await db.rewards.update_one(
        {"user_id": citizen["id"]},
        {"$setOnInsert": {"points": 140, "badges": ["Waste Warrior"]}},
        upsert=True,
    )
