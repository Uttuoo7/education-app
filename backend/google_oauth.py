from fastapi import APIRouter, Depends, HTTPException
from googleapiclient.discovery import build
from  auth import get_current_user
from  database import db
import uuid
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
import os

router = APIRouter(prefix="/google", tags=["Google"])

from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
import os

router = APIRouter(prefix="/google", tags=["Google"])

def exchange_code_for_credentials(code: str):

    client_config = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "project_id": "classhub",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uris": ["http://localhost:8000/api/google/callback"],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/calendar",
        ],
        redirect_uri="http://localhost:8000/api/google/callback",
    )

    flow.fetch_token(code=code)

    return flow.credentials

@router.get("/login")
async def google_login(user = Depends(get_current_user)):
    
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can connect Google")
    client_config = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "project_id": "classhub",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uris": ["http://localhost:8000/api/google/callback"],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/calendar",
        ],
        redirect_uri="http://localhost:8000/api/google/callback",
    )

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
    )

    return RedirectResponse(authorization_url)

@router.get("/callback")
async def google_callback(code: str, state: str):

    # 🔥 state contains teacher user_id
    teacher_id = state

    # 1️⃣ Exchange code for tokens
    credentials = exchange_code_for_credentials(code)

    # 2️⃣ Save tokens in DB
    await db.users.update_one(
        {"user_id": teacher_id},
        {
            "$set": {
                "google_access_token": credentials.token,
                "google_refresh_token": credentials.refresh_token,
                "google_connected": True
            }
        }
    )

    return {"message": "Google connected successfully"}