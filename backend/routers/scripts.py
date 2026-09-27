"""
Router for managing forensic scripts, source code, and deployment staging.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

scripts = [
    {
        "name": "mem_dump.go",
        "version": "v2.4.1",
        "lastDeployedOrDraft": "Deployed 2m ago",
        "isDeployed": True,
        "technique": "In-Memory Reflective Injection",
        "avBypassRate": "100% (0/72 Clean)",
        "targetPlatforms": ["Windows 11", "Windows Server 2022"],
        "mutationHash": "7f8b9a2c",
        "description": "Scans virtual address descriptors (VAD) and extracts active process memory without disk writes.",
        "sourceCode": """package main

import (
	"fmt"
	"syscall"
	"unsafe"
)

// DumpMemoryPages traverses unbacked memory pages without disk I/O
func DumpMemoryPages(pid uint32) error {
	handle, err := syscall.OpenProcess(0x1010, false, pid)
	if err != nil {
		return err
	}
	defer syscall.CloseHandle(handle)

	fmt.Printf("[+] Target process %d memory traversal active\\n", pid)
	return nil
}

func main() {
	DumpMemoryPages(4120)
}""",
        "irRepresentation": """entry:
  t0 = OpenProcess(pid=4120, access=0x1010)
  t1 = TraverseVADTree(t0)
  t2 = FilterUnbackedPages(t1, protect=PAGE_EXECUTE_READWRITE)
  ret t2""",
        "astStructure": """PackageDeclaration: main
Imports: [fmt, syscall, unsafe]
FunctionDecl: DumpMemoryPages(pid uint32) -> error
  ├── CallExpr: syscall.OpenProcess
  └── DeferStmt: syscall.CloseHandle""",
    },
    {
        "name": "proc_hollow_scan.go",
        "version": "v1.9.0",
        "lastDeployedOrDraft": "Deployed 4m ago",
        "isDeployed": True,
        "technique": "Process Hollowing",
        "avBypassRate": "98.6% (0/72 Clean)",
        "targetPlatforms": ["Ubuntu 22.04 LTS", "Ubuntu 24.04 LTS"],
        "mutationHash": "9b1c4e8f",
        "description": "Identifies stealth thread execution and anomalous anonymous epoll descriptors.",
        "sourceCode": """package main

import (
	"fmt"
	"os"
)

func ScanFileDescriptors() {
	entries, _ := os.ReadDir("/proc")
	fmt.Printf("[*] Scanning anonymous descriptors across %d targets\\n", len(entries))
}

func main() {
	ScanFileDescriptors()
}""",
        "irRepresentation": """entry:
  t0 = ReadProcEntries()
  t1 = InspectEpollFDs(t0)
  ret t1""",
        "astStructure": """PackageDeclaration: main
FunctionDecl: ScanFileDescriptors()
  └── CallExpr: os.ReadDir""",
    },
    {
        "name": "kernel_enum.go",
        "version": "v3.1.0",
        "lastDeployedOrDraft": "Deployed 9m ago",
        "isDeployed": True,
        "technique": "BYOVD Callback Subversion",
        "avBypassRate": "100% (0/72 Clean)",
        "targetPlatforms": ["Windows 10 Pro", "Windows Server 2022"],
        "mutationHash": "a1b2c3d4",
        "description": "Audits kernel driver callback arrays and patches at PspCreateProcessNotifyRoutine.",
        "sourceCode": """package main

import "fmt"

func AuditDriverCallbacks() {
	fmt.Println("[+] Auditing kernel callbacks for unauthorized modifications")
}

func main() {
	AuditDriverCallbacks()
}""",
        "irRepresentation": """entry:
  t0 = QueryKernelCallbacks(routine="PspCreateProcessNotifyRoutine")
  ret t0""",
        "astStructure": """PackageDeclaration: main
FunctionDecl: AuditDriverCallbacks()""",
    },
]


class ScriptCreate(BaseModel):
    name: str
    technique: Optional[str] = "In-Memory Reflective Injection"
    description: Optional[str] = "Custom forensic analysis routine"
    sourceCode: Optional[str] = "package main\n\nfunc main() {}\n"
    targetPlatforms: Optional[List[str]] = ["Windows 11", "Ubuntu 22.04 LTS"]


@router.get("/")
def list_scripts():
    """List available forensic scripts."""
    return scripts


@router.post("/")
def create_script(script_in: ScriptCreate):
    """Upload / stage a new forensic script."""
    new_script = {
        "name": script_in.name,
        "version": "v1.0.0",
        "lastDeployedOrDraft": "Staged just now",
        "isDeployed": False,
        "technique": script_in.technique,
        "avBypassRate": "100% (0/72 Clean)",
        "targetPlatforms": script_in.targetPlatforms or ["Windows 11", "Ubuntu 22.04 LTS"],
        "mutationHash": "3f9e8a1d",
        "description": script_in.description,
        "sourceCode": script_in.sourceCode,
        "irRepresentation": "entry:\n  t0 = InitCustomRoutine()\n  ret t0",
        "astStructure": "PackageDeclaration: main\nFunctionDecl: main()",
    }
    scripts.insert(0, new_script)
    return {"message": "Script uploaded successfully", "script": new_script}


@router.get("/{script_name}")
def get_script(script_name: str):
    """Retrieve details and source code of a specific script."""
    for s in scripts:
        if s["name"] == script_name:
            return s
    raise HTTPException(status_code=404, detail="Script not found")


@router.post("/{script_name}/deploy")
def toggle_deploy_script(script_name: str):
    """Deploy script or rollback deployment across fleet."""
    for s in scripts:
        if s["name"] == script_name:
            s["isDeployed"] = not s["isDeployed"]
            s["lastDeployedOrDraft"] = "Deployed just now" if s["isDeployed"] else "Draft rollback activated"
            return {"message": f"Deployment state toggled to {s['isDeployed']}", "script": s}
    raise HTTPException(status_code=404, detail="Script not found")


class ScriptUpdate(BaseModel):
    name: Optional[str] = None
    technique: Optional[str] = None
    description: Optional[str] = None
    sourceCode: Optional[str] = None
    version: Optional[str] = None
    targetPlatforms: Optional[List[str]] = None


@router.put("/{script_name}")
def update_script(script_name: str, update_data: ScriptUpdate):
    """Update source code, description or metadata of an existing script."""
    for s in scripts:
        if s["name"] == script_name:
            if update_data.name:
                s["name"] = update_data.name
            if update_data.technique:
                s["technique"] = update_data.technique
            if update_data.description:
                s["description"] = update_data.description
            if update_data.sourceCode is not None:
                s["sourceCode"] = update_data.sourceCode
                # Recompile mock AST / IR representations when source code changes
                s["lastDeployedOrDraft"] = "Modified & recompiled just now"
                s["mutationHash"] = hex(abs(hash(update_data.sourceCode)))[2:10]
                s["irRepresentation"] = f"entry:\n  // Recompiled from {s['name']}\n  t0 = ParseGoRoutine()\n  t1 = ExecuteVolatileMemoryScan()\n  ret t1"
                s["astStructure"] = f"PackageDeclaration: main\nRecompiledRoutine: {s['name']}\n  └── Verified In-Memory Execution"
            if update_data.version:
                s["version"] = update_data.version
            if update_data.targetPlatforms:
                s["targetPlatforms"] = update_data.targetPlatforms
            return {"message": "Script updated and recompiled successfully", "script": s}
    raise HTTPException(status_code=404, detail="Script not found")


@router.delete("/{script_name}")
def delete_script(script_name: str):
    """Delete a script from the library."""
    global scripts
    initial_len = len(scripts)
    scripts = [s for s in scripts if s["name"] != script_name]
    if len(scripts) == initial_len:
        raise HTTPException(status_code=404, detail="Script not found")
    return {"message": f"Script '{script_name}' deleted successfully", "script_name": script_name}

