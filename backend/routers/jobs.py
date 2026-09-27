"""
Router for managing forensic jobs with simulated asynchronous execution pipeline.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
import asyncio
import time
from routers.agents import agents

router = APIRouter()

# Pre-seeded forensic jobs matching demonstration history
jobs = [
    {
        "id": "JOB-8841",
        "scriptName": "mem_dump.go",
        "target": "NTRO-WIN-04",
        "targetOS": "Windows 11 Enterprise",
        "type": "Memory Analysis",
        "started": "2m ago",
        "duration": "48s",
        "status": "Completed",
        "findings": "14 anomalous processes identified in unbacked VAD trees",
        "evasionStatus": "Evaded",
        "avPresent": "CrowdStrike Falcon 7.14",
        "command": "jocky-go --target NTRO-WIN-04 --routine mem_dump.go --mode in-memory --stealth",
        "outputLog": [
            "[+] Initializing JOCKY Go in-memory execution routine...",
            "[+] Evading CrowdStrike Falcon 7.14 userland API hooks in ntdll.dll",
            "[+] Direct syscall SSN resolution successful (NtAllocateVirtualMemory, NtQueryVirtualMemory)",
            "[+] Traversed 1,842 Virtual Address Descriptors (VAD) without disk write",
            "[!] Identified 14 unbacked executable memory regions (PAGE_EXECUTE_READWRITE)",
            "[+] Forensic artifact snapshot saved to secure volatile cache buffer",
            "[✓] Job completed successfully in 48s.",
        ],
    },
    {
        "id": "JOB-8840",
        "scriptName": "proc_hollow_scan.go",
        "target": "FORENSIC-LNX-11",
        "targetOS": "Ubuntu 22.04.3 LTS",
        "type": "Process Forensics",
        "started": "4m ago",
        "duration": "1m 05s",
        "status": "Completed",
        "findings": "3 C2 beacons detected via suspicious epoll file descriptors",
        "evasionStatus": "Evaded",
        "avPresent": "Defender for Endpoint",
        "command": "jocky-go --target FORENSIC-LNX-11 --routine proc_hollow_scan.go --async",
        "outputLog": [
            "[+] Connected to Ubuntu 22.04.3 target via encrypted TLS 1.3 tunnel",
            "[+] Polymorphic mutation hash: 8f9a2e1d09 (AV signatures bypassed)",
            "[*] Inspecting anonymous inode handles in /proc/*/fd...",
            "[!] Detected 3 hidden epoll descriptors pointing to unmapped memory segments",
            "[*] Scanning thread execution states in real-time...",
            "[✓] Telemetry sync finished with zero local trace.",
        ],
    },
    {
        "id": "JOB-8839",
        "scriptName": "kernel_enum.go",
        "target": "NTRO-WIN-08",
        "targetOS": "Windows 10 Pro",
        "type": "Kernel Analysis",
        "started": "9m ago",
        "duration": "1m 12s",
        "status": "Completed",
        "findings": "Kernel callback tampered — PspCreateProcessNotifyRoutine patched",
        "evasionStatus": "Evaded",
        "avPresent": "Kaspersky Endpoint 12",
        "command": "jky-exec --target NTRO-WIN-08 --script kernel_enum.go --byovd-check",
        "outputLog": [
            "[+] Initialized kernel-level enumeration routine",
            "[+] Loaded signed vulnerable driver bypass filter",
            "[*] Auditing driver callback arrays at nt!PspCreateProcessNotifyRoutine",
            "[!] Detected hook redirecting to non-standard driver memory address: 0xFFFFF803214",
            "[+] Forensic evidence SHA-256 seal generated: 4b29a1efc39",
            "[✓] Inspection complete.",
        ],
    },
]


class JobCreate(BaseModel):
    agent_id: Optional[str] = None
    target: Optional[str] = None
    script_id: Optional[str] = "mem_dump.go"
    script_name: Optional[str] = "mem_dump.go"
    exec_mode: str = "in_memory"
    dispatch_all: bool = False


async def _run_simulated_job(job_id: str, script_name: str, target_name: str, target_os: str):
    """Simulates realistic asynchronous processing and populates execution output."""
    await asyncio.sleep(1.5)
    # Find job and update to Running
    for job in jobs:
        if job["id"] == job_id:
            job["status"] = "Running"
            job["duration"] = "Executing..."
            job["outputLog"].append(f"[*] Dispatched {script_name} to {target_name} ({target_os})...")
            job["outputLog"].append("[*] Bypassing endpoint heuristic inspection using in-memory reflection...")
            break

    await asyncio.sleep(2.0)
    # Complete job
    for job in jobs:
        if job["id"] == job_id:
            job["status"] = "Completed"
            job["duration"] = "3.2s"
            job["findings"] = "Verified 0 security alert tripwires; collected forensic snapshot clean."
            job["evasionStatus"] = "Evaded"
            job["outputLog"].extend([
                "[+] In-memory telemetry collection succeeded",
                f"[+] Extracted 8 system telemetry records from {target_name}",
                "[+] Cryptographic integrity digest: SHA-256 verified",
                f"[✓] Execution of {script_name} finished in 3.2s with 0 detections.",
            ])
            break


@router.post("/create")
async def create_job(job_req: JobCreate, background_tasks: BackgroundTasks):
    """
    Create and dispatch a script execution job to an agent or all fleet agents.
    Simulates real execution lifecycle and returns immediate job metadata.
    """
    created_jobs = []

    # Determine targets (single system vs all fleet)
    target_list = []
    target_identifier = (job_req.target or job_req.agent_id or "").strip().lower()

    if job_req.dispatch_all or not target_identifier or target_identifier == "all":
        target_list = agents
    else:
        target_list = [
            a for a in agents
            if a.get("agent_id", "").lower() == target_identifier
            or a.get("hostname", "").lower() == target_identifier
        ]
        if not target_list:
            # Fallback if matching name partially
            target_list = [
                a for a in agents
                if target_identifier in a.get("hostname", "").lower()
            ]
        if not target_list:
            target_list = agents[:1]

    script_label = job_req.script_name or job_req.script_id or "mem_dump.go"

    for idx, agent in enumerate(target_list):
        new_id = f"JOB-{int(time.time() * 1000) % 10000 + 8000}-{idx + 1}"
        job_data = {
            "id": new_id,
            "scriptName": script_label,
            "target": agent.get("hostname", "TARGET-NODE"),
            "targetOS": agent.get("os", "Windows 11 Enterprise"),
            "type": "Live Forensic Execution",
            "started": "Just now",
            "duration": "Starting...",
            "status": "Running",
            "findings": "Executing in-memory forensic routine...",
            "evasionStatus": "Evaded",
            "avPresent": agent.get("av_present", "EDR Active"),
            "command": f"jocky-go --target {agent.get('hostname')} --routine {script_label} --stealth",
            "outputLog": [
                f"[+] Initializing execution of {script_label} on {agent.get('hostname')}",
                "[+] Allocating non-executable staging page in memory",
                "[+] Applying polymorphic instruction substitution",
            ],
        }

        jobs.insert(0, job_data)
        created_jobs.append(job_data)

        # Trigger simulated execution in background
        background_tasks.add_task(
            _run_simulated_job,
            new_id,
            script_label,
            agent.get("hostname", "TARGET-NODE"),
            agent.get("os", "Linux/Windows")
        )

    return {
        "message": f"Dispatched {len(created_jobs)} job(s) across target endpoints",
        "jobs": created_jobs,
    }


@router.get("/")
def list_jobs():
    """List all scheduled and completed forensic jobs."""
    return jobs


@router.get("/{job_id}")
def get_job(job_id: str):
    """Retrieve details and execution log output for a specific job."""
    for job in jobs:
        if job["id"] == job_id:
            return job
    raise HTTPException(status_code=404, detail="Job not found")


@router.get("/pending/{agent_id}")
def get_pending_job(agent_id: str):
    """Get pending job for agent poll loop."""
    for job in jobs:
        if job.get("target") == agent_id and job.get("status") in ("pending", "Running"):
            return job
    return {"message": "No pending jobs", "agent_id": agent_id}