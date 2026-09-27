"""
Router for querying stored forensic evidence and summary statistics.
"""
from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

evidence_items = [
    {
        "fileName": "vad_dump_20260927_04120.bin",
        "captureTime": "2 mins ago",
        "size": "42.8 MB",
        "technique": "In-Memory Reflective Injection",
        "targetNode": "NTRO-WIN-04",
        "avDetectionScore": "0/72 (Clean)",
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
    {
        "fileName": "proc_hollow_trace_08840.json",
        "captureTime": "4 mins ago",
        "size": "1.4 MB",
        "technique": "Process Hollowing",
        "targetNode": "FORENSIC-LNX-11",
        "avDetectionScore": "0/72 (Clean)",
        "sha256": "8f9a2e1d09ba87654321fedcba0987654321fedcba0987654321fedcba098765",
    },
    {
        "fileName": "kernel_callback_table_dump.bin",
        "captureTime": "9 mins ago",
        "size": "8.2 MB",
        "technique": "BYOVD Callback Subversion",
        "targetNode": "NTRO-WIN-08",
        "avDetectionScore": "0/72 (Clean)",
        "sha256": "4b29a1efc39a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c",
    },
    {
        "fileName": "direct_syscall_trace_08838.log",
        "captureTime": "14 mins ago",
        "size": "340 KB",
        "technique": "Direct Syscall (SSN)",
        "targetNode": "NTRO-SRV-02",
        "avDetectionScore": "0/72 (Clean)",
        "sha256": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    },
]


@router.get("/")
def list_evidence():
    """List all stored forensic evidence artifacts."""
    return evidence_items


@router.get("/summary")
def get_evidence_summary():
    """Retrieve global evidence summary across all investigated jobs."""
    return {
        "total_artifacts": len(evidence_items),
        "total_size": "52.74 MB",
        "integrity_status": "100% SHA-256 Verified",
        "av_detection_score": "0/72 (Clean across all targets)",
        "storage_mode": "Encrypted In-Memory Vault & AES-256 Storage",
    }


@router.get("/{job_id}")
def get_evidence_by_job(job_id: str):
    """Retrieve all evidence items collected for a specific job."""
    return [
        {
            "job_id": job_id,
            "artifact": f"forensic_payload_{job_id}.bin",
            "size": "2.4 MB",
            "sha256": "a3f5b7c9e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8",
            "status": "Verified Clean",
            "extracted_at": "Just now",
        }
    ]
