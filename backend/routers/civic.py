from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import get_current_user
from lib.db import db
from models.civic import (
    ComplaintAssignment,
    ComplaintCreate,
    ComplaintOut,
    ComplaintStatusUpdate,
    MetricsOut,
    PickupCreate,
    PickupOut,
    ResolutionUpdate,
    WorkerOut,
)


router = APIRouter(tags=["civic"])
VALID_STATUSES = {"reported", "assigned", "in_progress", "resolved"}


async def _complaint_out(doc: dict) -> dict:
    worker = await db.users.find_one({"id": doc.get("assigned_worker_id")}) if doc.get("assigned_worker_id") else None
    return {
        **doc,
        "assigned_worker_name": worker.get("name") if worker else None,
    }


def _require(user: dict, role: str) -> None:
    if user.get("role") != role:
        raise HTTPException(status_code=403, detail="This area is restricted to the selected role")


@router.get("/complaints", response_model=list[ComplaintOut])
async def list_complaints(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == "citizen":
        query = {"citizen_id": user["id"]}
    elif user["role"] == "worker":
        query = {"assigned_worker_id": user["id"]}
    docs = await db.complaints.find(query).sort("created_at", -1).to_list(500)
    return [await _complaint_out(doc) for doc in docs]


@router.post("/complaints", response_model=ComplaintOut)
async def create_complaint(input: ComplaintCreate, user: dict = Depends(get_current_user)):
    _require(user, "citizen")
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        **input.model_dump(),
        "citizen_id": user["id"],
        "citizen_name": user["name"],
        "status": "reported",
        "assigned_worker_id": None,
        "resolution_note": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.complaints.insert_one(doc)
    return await _complaint_out(doc)


@router.patch("/complaints/{complaint_id}/status", response_model=ComplaintOut)
async def update_status(complaint_id: str, input: ComplaintStatusUpdate, user: dict = Depends(get_current_user)):
    _require(user, "admin")
    if input.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail="Unsupported complaint status")
    result = await db.complaints.update_one(
        {"id": complaint_id}, {"$set": {"status": input.status, "updated_at": datetime.now(timezone.utc)}}
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Complaint not found")
    doc = await db.complaints.find_one({"id": complaint_id})
    return await _complaint_out(doc)


@router.post("/complaints/{complaint_id}/assign", response_model=ComplaintOut)
async def assign_complaint(complaint_id: str, input: ComplaintAssignment, user: dict = Depends(get_current_user)):
    _require(user, "admin")
    worker = await db.users.find_one({"id": input.worker_id, "role": "worker", "active": True})
    if not worker:
        raise HTTPException(status_code=404, detail="Active worker not found")
    result = await db.complaints.update_one(
        {"id": complaint_id},
        {"$set": {"assigned_worker_id": worker["id"], "status": "assigned", "updated_at": datetime.now(timezone.utc)}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Complaint not found")
    doc = await db.complaints.find_one({"id": complaint_id})
    return await _complaint_out(doc)


@router.get("/worker/tasks", response_model=list[ComplaintOut])
async def worker_tasks(user: dict = Depends(get_current_user)):
    _require(user, "worker")
    docs = await db.complaints.find({"assigned_worker_id": user["id"]}).sort("priority", -1).to_list(500)
    return [await _complaint_out(doc) for doc in docs]


@router.post("/worker/tasks/{complaint_id}/start", response_model=ComplaintOut)
async def start_task(complaint_id: str, user: dict = Depends(get_current_user)):
    _require(user, "worker")
    result = await db.complaints.update_one(
        {"id": complaint_id, "assigned_worker_id": user["id"]},
        {"$set": {"status": "in_progress", "updated_at": datetime.now(timezone.utc)}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Assigned task not found")
    doc = await db.complaints.find_one({"id": complaint_id})
    return await _complaint_out(doc)


@router.post("/worker/tasks/{complaint_id}/complete", response_model=ComplaintOut)
async def complete_task(complaint_id: str, input: ResolutionUpdate, user: dict = Depends(get_current_user)):
    _require(user, "worker")
    result = await db.complaints.update_one(
        {"id": complaint_id, "assigned_worker_id": user["id"]},
        {"$set": {"status": "resolved", "resolution_note": input.resolution_note, "updated_at": datetime.now(timezone.utc)}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Assigned task not found")
    doc = await db.complaints.find_one({"id": complaint_id})
    return await _complaint_out(doc)


@router.post("/pickups", response_model=PickupOut)
async def create_pickup(input: PickupCreate, user: dict = Depends(get_current_user)):
    _require(user, "citizen")
    doc = {
        "id": str(uuid.uuid4()),
        **input.model_dump(),
        "citizen_id": user["id"],
        "citizen_name": user["name"],
        "status": "requested",
        "created_at": datetime.now(timezone.utc),
    }
    await db.pickups.insert_one(doc)
    return doc


@router.get("/pickups", response_model=list[PickupOut])
async def list_pickups(user: dict = Depends(get_current_user)):
    query = {"citizen_id": user["id"]} if user["role"] == "citizen" else {}
    docs = await db.pickups.find(query).sort("created_at", -1).to_list(500)
    return docs


@router.get("/admin/metrics", response_model=MetricsOut)
async def metrics(user: dict = Depends(get_current_user)):
    _require(user, "admin")
    docs = await db.complaints.find({}).to_list(1000)
    pickups = await db.pickups.count_documents({"status": {"$ne": "completed"}})
    return {
        "total_reports": len(docs),
        "pending": sum(doc.get("status") in {"reported", "assigned"} for doc in docs),
        "in_progress": sum(doc.get("status") == "in_progress" for doc in docs),
        "resolved": sum(doc.get("status") == "resolved" for doc in docs),
        "high_risk": sum(doc.get("priority") in {"high", "critical"} for doc in docs),
        "open_pickups": pickups,
    }


@router.get("/admin/workers", response_model=list[WorkerOut])
async def workers(user: dict = Depends(get_current_user)):
    _require(user, "admin")
    docs = await db.users.find({"role": "worker", "active": True}).to_list(100)
    return [
        {"id": doc["id"], "name": doc["name"], "email": doc["email"], "vehicle": doc.get("vehicle", "Field vehicle"), "active": doc.get("active", True)}
        for doc in docs
    ]


async def seed_demo_data() -> None:
    if await db.complaints.count_documents({}) > 0:
        return
    citizen = await db.users.find_one({"email": "citizen@example.com"})
    worker = await db.users.find_one({"email": "worker@example.com"})
    if not citizen or not worker:
        return
    now = datetime.now(timezone.utc)
    demo_complaints = [
        {
            "id": str(uuid.uuid4()), "category": "Illegal dumping", "priority": "high",
            "description": "Mixed waste has been left beside the market entrance for two days.",
            "location_address": "Khan Market entrance, New Delhi", "latitude": 28.6001, "longitude": 77.2273,
            "photo_url": None, "pickup_requested": False, "status": "assigned", "citizen_id": citizen["id"],
            "citizen_name": citizen["name"], "assigned_worker_id": worker["id"], "resolution_note": None,
            "created_at": now, "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()), "category": "Overflowing bin", "priority": "medium",
            "description": "The public bin near the bus stop is full and needs a collection.",
            "location_address": "Rajiv Chowk bus stop, New Delhi", "latitude": 28.6328, "longitude": 77.2197,
            "photo_url": None, "pickup_requested": False, "status": "reported", "citizen_id": citizen["id"],
            "citizen_name": citizen["name"], "assigned_worker_id": None, "resolution_note": None,
            "created_at": now, "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()), "category": "Street litter", "priority": "low",
            "description": "Street litter was cleared after the community clean-up drive.",
            "location_address": "Lodhi Garden gate 2, New Delhi", "latitude": 28.5933, "longitude": 77.2197,
            "photo_url": None, "pickup_requested": False, "status": "resolved", "citizen_id": citizen["id"],
            "citizen_name": citizen["name"], "assigned_worker_id": worker["id"], "resolution_note": "Area swept and bags moved to the ward collection point.",
            "created_at": now, "updated_at": now,
        },
    ]
    await db.complaints.insert_many(demo_complaints)
    await db.pickups.insert_one({
        "id": str(uuid.uuid4()), "citizen_id": citizen["id"], "citizen_name": citizen["name"],
        "item_type": "Old furniture", "address": "Connaught Place, New Delhi", "preferred_date": "2026-04-05",
        "notes": "Please call before arrival.", "status": "requested", "latitude": 28.6139, "longitude": 77.209,
        "created_at": now,
    })
