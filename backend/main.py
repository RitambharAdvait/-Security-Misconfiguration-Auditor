"""
FastAPI Backend for Windows Security Misconfiguration Auditor
Based on ASArP Framework (Aslam et al., 2015)
"""
import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Add parent directory to path so we can import auditor
sys.path.insert(0, str(Path(__file__).parent.parent))
from auditor import load_rules, run_audit, compute_scores, save_scan_json
import platform

app = FastAPI(
    title="Windows Security Auditor API",
    description="REST API for Windows security misconfiguration detection based on ASArP Framework",
    version="1.0.0"
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).parent.parent
RULES_PATH = BASE_DIR / "rules.yaml"
SCANS_DIR = BASE_DIR / "scans"
FRONTEND_DIR = BASE_DIR / "frontend" / "dist"

# Ensure scans directory exists
SCANS_DIR.mkdir(exist_ok=True)


# ============================================================================
# Pydantic Models
# ============================================================================

class AuditResult(BaseModel):
    rule_id: str
    category: str
    description: str
    severity: str
    expected_value: Any
    actual_value: Optional[Any] = None
    status: str
    error: Optional[str] = None
    risk_explanation: str
    remediation_command: str
    cis_reference: str
    mitre_tactic: str
    mitre_technique: str
    mitre_name: str


class AuditResponse(BaseModel):
    timestamp: str
    hostname: str
    os_version: str
    mode: str
    scores: Dict[str, Any]
    results: List[AuditResult]
    scan_id: str


class Rule(BaseModel):
    rule_id: str
    category: str
    description: str
    severity: str
    expected_value: Any
    cis_reference: str
    mitre_tactic: str
    mitre_technique: str
    mitre_name: str
    risk_explanation: str
    remediation_command: str


class ScanHistoryItem(BaseModel):
    scan_id: str
    timestamp: str
    hostname: str
    mode: str
    simple_score: float
    weighted_score: float
    passed: int
    failed: int
    errors: int


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Windows Security Auditor API",
        "version": "1.0.0",
        "status": "online",
        "framework": "ASArP (Aslam et al., 2015)"
    }


@app.get("/api/audit", response_model=AuditResponse)
async def run_audit_scan(demo: bool = Query(False, description="Run in demo mode with mock data")):
    """
    Trigger a new security audit scan

    - **demo**: If true, runs with mock data (no admin/Windows required)
    - Returns: Complete audit results with scores and findings
    """
    try:
        # Load rules
        rules = load_rules(str(RULES_PATH))

        # Run audit
        results = run_audit(rules, demo=demo)

        # Compute scores
        scores = compute_scores(results)

        # Save scan history
        scan_path = save_scan_json(results, scores, str(SCANS_DIR), demo=demo)
        scan_id = Path(scan_path).stem

        # Build response
        response = AuditResponse(
            timestamp=datetime.now().isoformat(),
            hostname=platform.node(),
            os_version=platform.platform(),
            mode="demo" if demo else "live",
            scores=scores,
            results=results,
            scan_id=scan_id
        )

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit scan failed: {str(e)}")


@app.get("/api/rules", response_model=List[Rule])
async def get_rules():
    """
    Retrieve all security rules from rules.yaml

    - Returns: List of all configured security rules with metadata
    """
    try:
        rules = load_rules(str(RULES_PATH))
        return [
            Rule(
                rule_id=r["rule_id"],
                category=r["category"],
                description=r["description"],
                severity=r["severity"],
                expected_value=r["expected_value"],
                cis_reference=r.get("cis_reference", "N/A"),
                mitre_tactic=r.get("mitre_tactic", "N/A"),
                mitre_technique=r.get("mitre_technique", "N/A"),
                mitre_name=r.get("mitre_name", "N/A"),
                risk_explanation=r.get("risk_explanation", ""),
                remediation_command=r.get("remediation_command", "")
            )
            for r in rules
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load rules: {str(e)}")


@app.get("/api/history", response_model=List[ScanHistoryItem])
async def get_scan_history(limit: int = Query(20, ge=1, le=100)):
    """
    Retrieve audit scan history

    - **limit**: Maximum number of scans to return (default 20, max 100)
    - Returns: List of historical scans sorted by timestamp (newest first)
    """
    try:
        scan_files = sorted(SCANS_DIR.glob("audit_*.json"), reverse=True)[:limit]
        history = []

        for scan_file in scan_files:
            with open(scan_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                history.append(ScanHistoryItem(
                    scan_id=scan_file.stem,
                    timestamp=data["timestamp"],
                    hostname=data["hostname"],
                    mode=data["mode"],
                    simple_score=data["scores"]["simple_score"],
                    weighted_score=data["scores"]["weighted_score"],
                    passed=data["scores"]["passed"],
                    failed=data["scores"]["failed"],
                    errors=data["scores"]["errors"]
                ))

        return history

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load scan history: {str(e)}")


@app.get("/api/results/{scan_id}", response_model=AuditResponse)
async def get_scan_results(scan_id: str):
    """
    Retrieve detailed results from a specific scan

    - **scan_id**: The scan identifier (e.g., "audit_20260930_145821")
    - Returns: Complete audit results for that scan
    """
    try:
        scan_path = SCANS_DIR / f"{scan_id}.json"

        if not scan_path.exists():
            raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

        with open(scan_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return AuditResponse(
            timestamp=data["timestamp"],
            hostname=data["hostname"],
            os_version=data["os_version"],
            mode=data["mode"],
            scores=data["scores"],
            results=data["results"],
            scan_id=scan_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load scan results: {str(e)}")


# ============================================================================
# Static File Serving (for React frontend)
# ============================================================================

# Mount frontend static files (Step 3 will create this)
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve React frontend for all non-API routes"""
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")

        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        else:
            raise HTTPException(status_code=404, detail="Frontend not built yet")


if __name__ == "__main__":
    import uvicorn
    print("Starting Windows Security Auditor API...")
    print(f"Dashboard: http://localhost:8000")
    print(f"API Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
