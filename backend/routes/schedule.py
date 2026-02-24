from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from uuid import uuid4
from backend.models.schedule import ScheduleCreate
from backend.database import db
from backend.auth import get_current_user

router = APIRouter(prefix="/api/schedule", tags=["Schedule"])

@router.post("/")
async def create_schedule(schedule: ScheduleCreate, user=Depends(get_current_user)):
    
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create schedules")

    new_schedule = {
        "id": str(uuid4()),
        "title": schedule.title,
        "description": schedule.description,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "meeting_link": schedule.meeting_link,
        "teacher_id": user["user_id"],
        "created_at": datetime.utcnow()
    }

    await db.schedules.insert_one(new_schedule)

    saved_schedule = await db.schedules.find_one(
        {"id": new_schedule["id"]},
        {"_id": 0}   # 🔥 remove ObjectId
    )

    return saved_schedule

@router.get("/")
async def get_schedules(user=Depends(get_current_user)):

    schedules = await db.schedules.find(
        {"teacher_id": user["user_id"]},
    ).to_list(100)
    
    for schedule in schedules:
        schedule.pop("_id", None)

    return schedules