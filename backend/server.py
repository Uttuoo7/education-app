from fastapi import FastAPI, APIRouter, HTTPException, status, Cookie, Response, UploadFile, File, Form, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from fastapi import Response
from  database import client
from  database import db
from  google_oauth import router as google_router
import uuid
from  routes import schedule
from  auth import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user,
    admin_required
)
from datetime import datetime, timezone, timedelta



app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)



class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    role: str = "student"
    created_at: Optional[datetime] = None 
    meet_link: Optional[str] = None 
    recording_link: Optional[str] = None



class ClassCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    start_time: str
    end_time: str
    max_students: int = 50
    recording_link: Optional[str] = None

class ClassResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    class_id: str
    title: str
    description: Optional[str]
    teacher_id: str
    teacher_name: str
    start_time: str
    end_time: str
    max_students: int
    enrolled_count: int
    meet_link: Optional[str]
    created_at: datetime

class EnrollmentCreate(BaseModel):
    class_id: str

class VideoCreate(BaseModel):
    class_id: str
    title: str
    video_url: Optional[str] = None
    description: Optional[str] = None

class VideoResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    video_id: str
    class_id: str
    title: str
    video_url: Optional[str]
    video_data: Optional[str] = None
    description: Optional[str]
    uploaded_by: str
    created_at: datetime

class UserUpdate(BaseModel):
    role: Optional[str] = None
    name: Optional[str] = None
    meet_link: Optional[str] = None

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Teacher(BaseModel):
    name: str
    email: str
    google_connected: bool = False
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str


@api_router.get("/")
async def root():
    return {"message": "ClassHub API", "status": "running"}

@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: RegisterRequest):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)

    new_user = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "role": "student",
        "created_at": datetime.now(timezone.utc)
    }

    await db.users.insert_one(new_user)

    user_response = {k: v for k, v in new_user.items() if k != "password"}
    return User(**user_response)

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends

from fastapi import Response

@api_router.post("/auth/login")
async def login_user(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = await db.users.find_one({"email": form_data.username})

    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_access_token({"sub": user["user_id"]})

    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {k: v for k, v in user.items() if k not in ["password", "_id"]}
    }


@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user (used by AuthContext on every page load)."""
    return User(**{k: v for k, v in current_user.items() if k != "password"})


@api_router.post("/auth/logout")
async def logout_user(response: Response):
    """Clear the auth cookie."""
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"message": "Logged out successfully"}


@api_router.post("/classes", response_model=ClassResponse)
async def create_class(class_data: ClassCreate, user: dict = Depends(get_current_user)):
    
    if user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can create classes")
    
    class_id = f"class_{uuid.uuid4().hex[:12]}"
    
    new_class = {
        "class_id": class_id,
        "title": class_data.title,
        "description": class_data.description,
        "teacher_id": user.get("user_id"),
        "teacher_name": user.get("name"),
        "start_time": class_data.start_time,
        "end_time": class_data.end_time,
        "max_students": class_data.max_students,
        "enrolled_count": 0,
        "meet_link": user.get("meet_link"),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.classes.insert_one(new_class)
    
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    return ClassResponse(**class_doc)

@api_router.get("/classes", response_model=List[ClassResponse])
async def get_classes(user: dict = Depends(get_current_user)):
    if user.get("role") == "teacher":
        classes = await db.classes.find({"teacher_id": user.get("user_id")}, {"_id": 0}).to_list(1000)
    elif user.get("role") == "student":
        enrollments = await db.enrollments.find({"user_id": user.get("user_id")}, {"_id": 0}).to_list(1000)
        class_ids = [e["class_id"] for e in enrollments]
        classes = await db.classes.find({"class_id": {"$in": class_ids}}, {"_id": 0}).to_list(1000)
    else:
        classes = await db.classes.find({}, {"_id": 0}).to_list(1000)

    # Enrich each class with the teacher's *current* meet_link
    teacher_cache = {}
    for cls in classes:
        tid = cls.get("teacher_id")
        if tid not in teacher_cache:
            teacher_cache[tid] = await db.users.find_one({"user_id": tid}, {"_id": 0})
        teacher = teacher_cache.get(tid) or {}
        cls["meet_link"] = teacher.get("meet_link")
    return [ClassResponse(**c) for c in classes]

@api_router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class(class_id: str, user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")

    # Always show teacher's current meet_link
    teacher = await db.users.find_one({"user_id": class_doc.get("teacher_id")}, {"_id": 0}) or {}
    class_doc["meet_link"] = teacher.get("meet_link")

    return ClassResponse(**class_doc)

@api_router.post("/classes/{class_id}/meet")
async def create_meet_link(class_id: str, user: dict = Depends(get_current_user)):
   
    
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user.get("user_id") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only the teacher or admin can create meet links")
    
    meet_code = uuid.uuid4().hex[:10]
    meet_link = f"https://meet.google.com/{meet_code}"
    
    await db.classes.update_one(
        {"class_id": class_id},
        {"$set": {"meet_link": meet_link}}
    )
    
    return {"meet_link": meet_link}

@api_router.post("/enrollments")
async def enroll_in_class(enrollment: EnrollmentCreate, user: dict = Depends(get_current_user)):

    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can enroll")
    
    class_doc = await db.classes.find_one({"class_id": enrollment.class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    existing = await db.enrollments.find_one({"user_id": user.get("user_id"), "class_id": enrollment.class_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")
    
    if class_doc["enrolled_count"] >= class_doc["max_students"]:
        raise HTTPException(status_code=400, detail="Class is full")
    
    enrollment_id = f"enroll_{uuid.uuid4().hex[:12]}"
    await db.enrollments.insert_one({
        "enrollment_id": enrollment_id,
        "user_id": user.get("user_id"),
        "class_id": enrollment.class_id,
        "enrolled_at": datetime.now(timezone.utc)
    })
    
    await db.classes.update_one(
        {"class_id": enrollment.class_id},
        {"$inc": {"enrolled_count": 1}}
    )
    
    return {"message": "Enrolled successfully"}

@api_router.get("/enrollments")
async def get_enrollments(user: dict = Depends(get_current_user)):
    
    enrollments = await db.enrollments.find({"user_id": user.get("user_id")}, {"_id": 0}).to_list(1000)
    return enrollments

@api_router.post("/videos", response_model=VideoResponse)
async def create_video(video_data: VideoCreate, user: dict = Depends(get_current_user)):
    
    if user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can upload videos")
    
    video_id = f"video_{uuid.uuid4().hex[:12]}"
    
    new_video = {
        "video_id": video_id,
        "class_id": video_data.class_id,
        "title": video_data.title,
        "video_url": video_data.video_url,
        "description": video_data.description,
        "uploaded_by": user.get("user_id"),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.videos.insert_one(new_video)
    
    video_doc = await db.videos.find_one({"video_id": video_id}, {"_id": 0})
    return VideoResponse(**video_doc)

@api_router.get("/videos", response_model=List[VideoResponse])
async def get_videos(class_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    
    query = {"class_id": class_id} if class_id else {}
    videos = await db.videos.find(query, {"_id": 0}).to_list(1000)
    
    return [VideoResponse(**v) for v in videos]

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(admin_required)):
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return [User(**u) for u in users]
    

@api_router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: dict = Depends(admin_required)
):
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@api_router.patch("/classes/{class_id}/recording")
async def add_recording(
    class_id: str,
    recording_link: str,
    user: dict = Depends(get_current_user)
):
    class_doc = await db.classes.find_one({"class_id": class_id})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")

    if class_doc["teacher_id"] != user.get("user_id") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only teacher or admin can add recording")

    await db.classes.update_one(
        {"class_id": class_id},
        {"$set": {"recording_link": recording_link}}
    )

    return {"message": "Recording link added successfully"}

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, user: dict = Depends(get_current_user)):
    
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if class_doc["teacher_id"] != user.get("user_id") and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only the teacher or admin can delete this class")
    
    await db.classes.delete_one({"class_id": class_id})
    await db.enrollments.delete_many({"class_id": class_id})
    
    return {"message": "Class deleted successfully"}


# ─────────────────────────────────────────────────────────────────────────────
# ANNOUNCEMENTS
# ─────────────────────────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    title: str
    content: str

@api_router.post("/classes/{class_id}/announcements")
async def create_announcement(class_id: str, data: AnnouncementCreate, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can post announcements")
    doc = {
        "announcement_id": f"ann_{uuid.uuid4().hex[:12]}",
        "class_id": class_id,
        "title": data.title,
        "content": data.content,
        "posted_by": user.get("user_id"),
        "posted_by_name": user.get("name"),
        "created_at": datetime.now(timezone.utc),
    }
    await db.announcements.insert_one(doc)
    return {"message": "Announcement posted", "announcement_id": doc["announcement_id"]}

@api_router.get("/classes/{class_id}/announcements")
async def get_announcements(class_id: str, user: dict = Depends(get_current_user)):
    items = await db.announcements.find({"class_id": class_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


# ─────────────────────────────────────────────────────────────────────────────
# HOMEWORK / ASSIGNMENTS
# ─────────────────────────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: str  # ISO string

@api_router.post("/classes/{class_id}/assignments")
async def create_assignment(class_id: str, data: AssignmentCreate, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can post assignments")
    doc = {
        "assignment_id": f"asn_{uuid.uuid4().hex[:12]}",
        "class_id": class_id,
        "title": data.title,
        "description": data.description,
        "due_date": data.due_date,
        "created_by": user.get("user_id"),
        "created_by_name": user.get("name"),
        "created_at": datetime.now(timezone.utc),
    }
    await db.assignments.insert_one(doc)
    return {"message": "Assignment created", "assignment_id": doc["assignment_id"]}

@api_router.get("/classes/{class_id}/assignments")
async def get_assignments(class_id: str, user: dict = Depends(get_current_user)):
    items = await db.assignments.find({"class_id": class_id}, {"_id": 0}).sort("due_date", 1).to_list(100)
    return items

@api_router.get("/assignments")
async def get_all_assignments(user: dict = Depends(get_current_user)):
    """Return all assignments across all classes the user is enrolled in (students) or teaches (teacher)."""
    if user.get("role") == "student":
        enrollments = await db.enrollments.find({"user_id": user.get("user_id")}, {"_id": 0}).to_list(1000)
        class_ids = [e["class_id"] for e in enrollments]
        items = await db.assignments.find({"class_id": {"$in": class_ids}}, {"_id": 0}).sort("due_date", 1).to_list(500)
    elif user.get("role") == "teacher":
        classes = await db.classes.find({"teacher_id": user.get("user_id")}, {"_id": 0}).to_list(1000)
        class_ids = [c["class_id"] for c in classes]
        items = await db.assignments.find({"class_id": {"$in": class_ids}}, {"_id": 0}).sort("due_date", 1).to_list(500)
    else:
        items = await db.assignments.find({}, {"_id": 0}).sort("due_date", 1).to_list(500)
    return items

@api_router.delete("/classes/{class_id}/assignments/{assignment_id}")
async def delete_assignment(class_id: str, assignment_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can delete assignments")
    await db.assignments.delete_one({"assignment_id": assignment_id, "class_id": class_id})
    return {"message": "Assignment deleted"}


# ─────────────────────────────────────────────────────────────────────────────
# LESSON NOTES
# ─────────────────────────────────────────────────────────────────────────────

class NoteCreate(BaseModel):
    content: str
    session_date: str  # ISO date string

@api_router.post("/classes/{class_id}/notes")
async def create_note(class_id: str, data: NoteCreate, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can add notes")
    doc = {
        "note_id": f"note_{uuid.uuid4().hex[:12]}",
        "class_id": class_id,
        "content": data.content,
        "session_date": data.session_date,
        "created_by": user.get("user_id"),
        "created_by_name": user.get("name"),
        "created_at": datetime.now(timezone.utc),
    }
    await db.notes.insert_one(doc)
    return {"message": "Note saved", "note_id": doc["note_id"]}

@api_router.get("/classes/{class_id}/notes")
async def get_notes(class_id: str, user: dict = Depends(get_current_user)):
    items = await db.notes.find({"class_id": class_id}, {"_id": 0}).sort("session_date", -1).to_list(200)
    return items

@api_router.delete("/classes/{class_id}/notes/{note_id}")
async def delete_note(class_id: str, note_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can delete notes")
    await db.notes.delete_one({"note_id": note_id, "class_id": class_id})
    return {"message": "Note deleted"}


# ─────────────────────────────────────────────────────────────────────────────
# ATTENDANCE
# ─────────────────────────────────────────────────────────────────────────────

class AttendanceRecord(BaseModel):
    student_id: str
    status: str  # "present" | "absent" | "late"

class AttendanceCreate(BaseModel):
    session_date: str  # ISO date
    records: List[AttendanceRecord]

@api_router.post("/classes/{class_id}/attendance")
async def save_attendance(class_id: str, data: AttendanceCreate, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can record attendance")
    doc = {
        "attendance_id": f"att_{uuid.uuid4().hex[:12]}",
        "class_id": class_id,
        "session_date": data.session_date,
        "records": [r.model_dump() for r in data.records],
        "marked_by": user.get("user_id"),
        "created_at": datetime.now(timezone.utc),
    }
    # Upsert by class_id + session_date so re-submitting a date overwrites
    await db.attendance.replace_one(
        {"class_id": class_id, "session_date": data.session_date},
        doc,
        upsert=True
    )
    return {"message": "Attendance saved"}

@api_router.get("/classes/{class_id}/attendance")
async def get_attendance(class_id: str, user: dict = Depends(get_current_user)):
    items = await db.attendance.find({"class_id": class_id}, {"_id": 0}).sort("session_date", -1).to_list(200)
    return items


# ─────────────────────────────────────────────────────────────────────────────
# PROGRESS / GRADES
# ─────────────────────────────────────────────────────────────────────────────

class ProgressCreate(BaseModel):
    student_id: str
    grade: Optional[str] = None   # e.g. "A", "85%", "Pass"
    comment: Optional[str] = None

@api_router.post("/classes/{class_id}/progress")
async def add_progress(class_id: str, data: ProgressCreate, user: dict = Depends(get_current_user)):
    if user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can add progress")
    doc = {
        "progress_id": f"prog_{uuid.uuid4().hex[:12]}",
        "class_id": class_id,
        "student_id": data.student_id,
        "grade": data.grade,
        "comment": data.comment,
        "added_by": user.get("user_id"),
        "created_at": datetime.now(timezone.utc),
    }
    # Upsert: one progress record per student per class
    await db.progress.replace_one(
        {"class_id": class_id, "student_id": data.student_id},
        doc,
        upsert=True
    )
    return {"message": "Progress updated"}

@api_router.get("/classes/{class_id}/progress")
async def get_progress(class_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") == "student":
        items = await db.progress.find(
            {"class_id": class_id, "student_id": user.get("user_id")}, {"_id": 0}
        ).to_list(10)
    else:
        items = await db.progress.find({"class_id": class_id}, {"_id": 0}).to_list(100)
    return items

@api_router.get("/progress")
async def get_my_progress(user: dict = Depends(get_current_user)):
    """All progress records for the current student."""
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only")
    items = await db.progress.find({"student_id": user.get("user_id")}, {"_id": 0}).to_list(100)
    return items


# ─────────────────────────────────────────────────────────────────────────────
# STUDENT CREDITS
# ─────────────────────────────────────────────────────────────────────────────

class CreditAdjust(BaseModel):
    amount: float          # positive = add, negative = deduct
    note: Optional[str] = None

@api_router.post("/students/{student_id}/credits")
async def adjust_credits(student_id: str, data: CreditAdjust, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    transaction = {
        "tx_id": f"tx_{uuid.uuid4().hex[:12]}",
        "student_id": student_id,
        "amount": data.amount,
        "note": data.note,
        "created_by": user.get("user_id"),
        "created_at": datetime.now(timezone.utc),
    }
    await db.credit_transactions.insert_one(transaction)
    # Update balance on user document
    await db.users.update_one(
        {"user_id": student_id},
        {"$inc": {"credit_balance": data.amount}}
    )
    return {"message": "Credits adjusted"}

@api_router.get("/students/{student_id}/credits")
async def get_credits(student_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin" and user.get("user_id") != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    student = await db.users.find_one({"user_id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    transactions = await db.credit_transactions.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return {"balance": student.get("credit_balance", 0), "transactions": transactions}

@api_router.get("/credits")
async def get_all_credits(user: dict = Depends(get_current_user)):
    """Admin: get credit balance for all students."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    students = await db.users.find({"role": "student"}, {"_id": 0}).to_list(1000)
    return [
        {"user_id": s["user_id"], "name": s.get("name"), "email": s.get("email"),
         "credit_balance": s.get("credit_balance", 0)}
        for s in students
    ]


# ─────────────────────────────────────────────────────────────────────────────
# INVOICES
# ─────────────────────────────────────────────────────────────────────────────

class InvoiceCreate(BaseModel):
    student_id: str
    amount: float
    description: str
    due_date: str   # ISO date string

@api_router.post("/invoices")
async def create_invoice(data: InvoiceCreate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    student = await db.users.find_one({"user_id": data.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    doc = {
        "invoice_id": f"inv_{uuid.uuid4().hex[:12]}",
        "student_id": data.student_id,
        "student_name": student.get("name"),
        "student_email": student.get("email"),
        "amount": data.amount,
        "description": data.description,
        "due_date": data.due_date,
        "status": "unpaid",     # "unpaid" | "paid"
        "created_by": user.get("user_id"),
        "created_at": datetime.now(timezone.utc),
    }
    await db.invoices.insert_one(doc)
    return {"message": "Invoice created", "invoice_id": doc["invoice_id"]}

@api_router.get("/invoices")
async def get_invoices(user: dict = Depends(get_current_user)):
    if user.get("role") == "admin":
        items = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    else:
        items = await db.invoices.find(
            {"student_id": user.get("user_id")}, {"_id": 0}
        ).sort("created_at", -1).to_list(200)
    return items

@api_router.patch("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    """Mark an invoice as paid (admin only)."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.invoices.update_one(
        {"invoice_id": invoice_id},
        {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice marked as paid"}

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await db.invoices.delete_one({"invoice_id": invoice_id})
    return {"message": "Invoice deleted"}



app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://education-app-r35s.onrender.com",
        # Vercel deployments
        "https://education-c7ys20tr7-uttuoo7s-projects.vercel.app",
        "https://education-app-uttuoo7s-projects.vercel.app",
        "https://education-app.vercel.app",
        # StarZEdu Classes Vercel deployments
        "https://starzeduclasses.vercel.app",
        "https://education-app-frontend.onrender.com",
        "https://education-k8w7qgrhc-uttuoo7s-projects.vercel.app",
        "https://starzedu.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

app.include_router(api_router)
app.include_router(google_router, prefix="/api")
app.include_router(schedule.router)