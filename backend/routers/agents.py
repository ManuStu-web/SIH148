"""
Router for managing endpoint agents with realistic pre-seeded demonstration data.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# Pre-seeded demonstration fleet (5 agents across Windows & Linux)
agents = [
    {
        "agent_id": "AGT-8401",
        "hostname": "NTRO-WIN-04",
        "os": "Windows 11 Enterprise",
        "architecture": "x86_64",
        "status": "online",
        "ip": "10.42.18.91",
        "latency": "42 ms",
        "last_run": "2m ago",
        "technique": "In-Memory Reflective Injection",
        "av_status": "Bypassed (0 Detections)",
        "av_present": "CrowdStrike Falcon 7.14",
        "last_script": "mem_dump.go",
        "evasion_status": "Evaded",
    },
    {
        "agent_id": "AGT-8402",
        "hostname": "FORENSIC-LNX-11",
        "os": "Ubuntu 22.04.3 LTS",
        "architecture": "x86_64",
        "status": "online",
        "ip": "10.42.20.104",
        "latency": "18 ms",
        "last_run": "4m ago",
        "technique": "Process Hollowing",
        "av_status": "Stealth Verified",
        "av_present": "Defender for Endpoint",
        "last_script": "proc_hollow_scan.go",
        "evasion_status": "Evaded",
    },
    {
        "agent_id": "AGT-8403",
        "hostname": "NTRO-WIN-08",
        "os": "Windows 10 Pro",
        "architecture": "x86_64",
        "status": "online",
        "ip": "10.42.18.112",
        "latency": "65 ms",
        "last_run": "9m ago",
        "technique": "BYOVD Callback Subversion",
        "av_status": "Bypassed (0 Detections)",
        "av_present": "Kaspersky Endpoint 12",
        "last_script": "kernel_enum.go",
        "evasion_status": "Evaded",
    },
    {
        "agent_id": "AGT-8404",
        "hostname": "NTRO-SRV-02",
        "os": "Windows Server 2022",
        "architecture": "x86_64",
        "status": "online",
        "ip": "10.42.15.50",
        "latency": "31 ms",
        "last_run": "1m ago",
        "technique": "Direct Syscall (SSN)",
        "av_status": "Bypassed (0 Detections)",
        "av_present": "SentinelOne Complete 23.2",
        "last_script": "direct_syscall.go",
        "evasion_status": "Evaded",
    },
    {
        "agent_id": "AGT-8405",
        "hostname": "SEC-UBUNTU-01",
        "os": "Ubuntu 24.04 LTS",
        "architecture": "aarch64",
        "status": "online",
        "ip": "10.42.22.88",
        "latency": "24 ms",
        "last_run": "6m ago",
        "technique": "Polymorphic LLVM Mutation",
        "av_status": "Stealth Verified",
        "av_present": "Sophos Intercept X",
        "last_script": "api_unhook.go",
        "evasion_status": "Evaded",
    },
]


class AgentRegistration(BaseModel):
    agent_id: str
    hostname: str
    os: str
    architecture: str
    ip: Optional[str] = "10.42.30.55"
    technique: Optional[str] = "Forensic Telemetry Inspection"


@router.get("/")
def list_agents():
    """List all registered agents."""
    return agents


@router.post("/register")
def register_agent(agent: AgentRegistration):
    """Register a new endpoint agent."""
    for existing in agents:
        if existing["agent_id"] == agent.agent_id:
            return {
                "message": "Agent already registered",
                "agent": existing
            }

    agent_data = {
        "agent_id": agent.agent_id,
        "hostname": agent.hostname,
        "os": agent.os,
        "architecture": agent.architecture,
        "status": "online",
        "ip": agent.ip or "10.42.30.55",
        "latency": "22 ms",
        "last_run": "Just now",
        "technique": agent.technique or "Forensic Collection",
        "av_status": "Bypassed (0 Detections)",
        "av_present": "Defender for Endpoint",
        "last_script": "custom_probe.go",
        "evasion_status": "Evaded",
    }

    agents.append(agent_data)

    return {
        "message": "Agent registered successfully",
        "agent": agent_data
    }


@router.patch("/{agent_id}/status")
def update_agent_status(agent_id: str, status: str):
    """Update status of a specific agent."""
    for agent in agents:
        if agent["agent_id"] == agent_id:
            agent["status"] = status
            return {
                "message": "Status updated",
                "agent": agent
            }

    return {"error": "Agent not found"}


@router.patch("/{agent_id}/heartbeat")
def agent_heartbeat(agent_id: str):
    """Handle periodic heartbeat ping from agent."""
    for agent in agents:
        if agent["agent_id"] == agent_id:
            agent["status"] = "online"
            agent["last_run"] = "Just now"
            return {
                "message": "Heartbeat received",
                "agent_id": agent_id,
                "status": "online"
            }

    return {"error": "Agent not found"}


@router.delete("/{agent_id}")
def delete_agent(agent_id: str):
    """De-register an endpoint agent."""
    global agents
    agents = [a for a in agents if a["agent_id"] != agent_id]
    return {"message": "Agent deleted successfully", "agent_id": agent_id}