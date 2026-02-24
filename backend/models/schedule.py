from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import uuid4

class ScheduleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    meeting_link: Optional[str] = None

class ScheduleInDB(ScheduleCreate):
    id: str
    teacher_id: str
    created_at: datetime