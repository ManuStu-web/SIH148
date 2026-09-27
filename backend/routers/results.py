"""
Router for managing forensic execution results and telemetry data.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()

results = [
    {
        "job_id": "JOB-8841",
        "agent_id": "AGT-8401",
        "hostname": "NTRO-WIN-04",
        "os": "Windows 11 Enterprise",
        "status": "Completed",
        "timestamp": "2 mins ago",
        "message": "In-memory memory extraction completed with 0 tripwires",
        "summary": "14 unbacked memory regions analyzed. EDR hooks in ntdll.dll successfully bypassed.",
        "findings": ["14 VAD descriptors inspected", "0 disk writes committed", "Clean integrity score"],
    },
    {
        "job_id": "JOB-8840",
        "agent_id": "AGT-8402",
        "hostname": "FORENSIC-LNX-11",
        "os": "Ubuntu 22.04.3 LTS",
        "status": "Completed",
        "timestamp": "4 mins ago",
        "message": "Process scan completed across all namespaces",
        "summary": "3 hidden epoll descriptors identified without generating kernel audit alert.",
        "findings": ["3 suspicious epoll sockets", "TLS 1.3 encrypted return", "Polymorphic payload clean"],
    },
    {
        "job_id": "JOB-8839",
        "agent_id": "AGT-8403",
        "hostname": "NTRO-WIN-08",
        "os": "Windows 10 Pro",
        "status": "Completed",
        "timestamp": "9 mins ago",
        "message": "Kernel driver callback enumeration complete",
        "summary": "Audited PspCreateProcessNotifyRoutine array. Tamper-evident evidence sealed.",
        "findings": ["Kernel callback table dumped", "SHA-256 seal: 4b29a1efc39"],
    },
]


class JobResult(BaseModel):
    job_id: str
    agent_id: str
    status: str
    message: str
    hostname: str
    os: str
    timestamp: Optional[str] = "Just now"
    summary: Optional[str] = None
    findings: Optional[List[str]] = None


@router.post("/submit")
def submit_result(result: JobResult):
    result_data = result.model_dump()
    results.insert(0, result_data)
    return {
        "message": "Result received and indexed in forensic vault",
        "result": result_data,
    }


@router.get("/")
def list_results():
    """List all ingested job results."""
    return results


@router.get("/{job_id}")
def get_result(job_id: str):
    """Retrieve forensic result for a specific job."""
    for r in results:
        if r.get("job_id") == job_id:
            return r
    return {"message": "Result not found", "job_id": job_id}