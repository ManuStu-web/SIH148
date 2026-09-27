"""
Authentication router: login, refresh token, and credential verification.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(creds: LoginRequest):
    """Authenticate investigator credentials and issue JWT."""
    return {
        "access_token": "jocky_demo_jwt_token_secops_lead_2026",
        "token_type": "bearer",
        "expires_in": 28800,
        "user": {
            "username": creds.username,
            "role": "SecOps Lead & Forensic Analyst",
            "clearance": "Top Secret / Operational Telemetry",
            "email": f"{creds.username}@tartarus.internal",
        },
    }


@router.post("/refresh")
def refresh_token():
    """Refresh an existing or expiring JWT."""
    return {
        "access_token": "jocky_refreshed_demo_jwt_token_2026",
        "token_type": "bearer",
        "expires_in": 28800,
    }


@router.get("/me")
def get_current_user():
    """Retrieve currently authenticated investigator profile."""
    return {
        "username": "admin",
        "role": "SecOps Lead & Forensic Analyst",
        "clearance": "Top Secret / Operational Telemetry",
        "permissions": ["deploy_scripts", "inspect_records", "export_reports", "manage_agents"],
    }
