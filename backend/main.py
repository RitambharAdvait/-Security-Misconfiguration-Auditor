"""
FastAPI Backend for Windows Security Misconfiguration Auditor
Based on ASArP Framework (Aslam et al., 2015)
"""
import os
import sys
import json
import time
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
from certifier import sign_audit_record, verify_audit_record
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

class AttestationSeal(BaseModel):
    sha256_hash: str
    signature: str
    algorithm: str
    public_key_pem: str
    signed_at: str
    verified: bool
    signer: str


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
    execution_time: Optional[float] = None


class AuditResponse(BaseModel):
    timestamp: str
    hostname: str
    os_version: str
    mode: str
    scores: Dict[str, Any]
    results: List[AuditResult]
    scan_id: str
    execution_time: Optional[float] = None
    attestation_seal: Optional[AttestationSeal] = None


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
    execution_time: Optional[float] = None
    attestation_seal: Optional[AttestationSeal] = None


class RuleDiffItem(BaseModel):
    rule_id: str
    category: str
    description: str
    severity: str
    mitre_tactic: str
    mitre_technique: str
    base_status: str
    target_status: str
    base_latency: Optional[float] = None
    target_latency: Optional[float] = None
    latency_delta: Optional[float] = None
    diff_type: str  # 'REMEDIATED', 'REGRESSED', 'PERSISTENT_FAIL', 'UNCHANGED_PASS', 'ERROR'


class CategoryShiftItem(BaseModel):
    category: str
    base_passed: int
    base_total: int
    target_passed: int
    target_total: int
    passed_delta: int


class AuditComparisonResponse(BaseModel):
    base_scan_id: str
    target_scan_id: str
    base_timestamp: str
    target_timestamp: str
    base_mode: str
    target_mode: str
    base_weighted_score: float
    target_weighted_score: float
    score_delta: float
    base_simple_score: float
    target_simple_score: float
    simple_score_delta: float
    base_passed: int
    target_passed: int
    passed_delta: int
    base_failed: int
    target_failed: int
    failed_delta: int
    base_errors: int
    target_errors: int
    base_latency: Optional[float] = None
    target_latency: Optional[float] = None
    latency_delta: Optional[float] = None
    speedup_percent: Optional[float] = None
    base_throughput: Optional[float] = None
    target_throughput: Optional[float] = None
    throughput_delta: Optional[float] = None
    remediated_count: int
    regressed_count: int
    persistent_fail_count: int
    unchanged_pass_count: int
    error_count: int
    category_shifts: List[CategoryShiftItem]
    rule_diffs: List[RuleDiffItem]
    base_seal_valid: bool
    target_seal_valid: bool
    base_seal_hash: Optional[str] = None
    target_seal_hash: Optional[str] = None


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Serve React frontend dashboard if built, else return API health status"""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {
        "service": "Windows Security Auditor API",
        "version": "1.0.0",
        "status": "online",
        "framework": "ASArP (Aslam et al., 2015)"
    }


@app.get("/api/health")
async def health_check():
    """API health status endpoint"""
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

        # Run audit and measure execution time
        start_time = time.perf_counter()
        results = run_audit(rules, demo=demo)
        elapsed = time.perf_counter() - start_time
        execution_time = round(elapsed, 2) if elapsed >= 0.1 else round(max(elapsed, 0.01), 3)

        # Compute scores
        scores = compute_scores(results)
        scores["execution_time"] = execution_time

        # Save scan history (sealed cryptographically)
        scan_path = save_scan_json(results, scores, str(SCANS_DIR), demo=demo, execution_time=execution_time)
        scan_id = Path(scan_path).stem

        with open(scan_path, "r", encoding="utf-8") as f:
            saved_data = json.load(f)

        # Build response
        response = AuditResponse(
            timestamp=saved_data["timestamp"],
            hostname=saved_data["hostname"],
            os_version=saved_data["os_version"],
            mode=saved_data["mode"],
            scores=saved_data["scores"],
            results=saved_data["results"],
            scan_id=scan_id,
            execution_time=saved_data.get("execution_time"),
            attestation_seal=saved_data.get("attestation_seal")
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
                    errors=data["scores"]["errors"],
                    execution_time=data.get("execution_time", data.get("scores", {}).get("execution_time")),
                    attestation_seal=data.get("attestation_seal")
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
            scan_id=scan_id,
            execution_time=data.get("execution_time", data.get("scores", {}).get("execution_time")),
            attestation_seal=data.get("attestation_seal")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load scan results: {str(e)}")


@app.get("/api/verify/{scan_id}")
async def verify_scan_seal(scan_id: str):
    """
    Verify the cryptographic attestation seal of a saved scan report
    against Anti-TOCTOU tampering.
    """
    try:
        scan_path = SCANS_DIR / f"{scan_id}.json"
        if not scan_path.exists():
            raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

        with open(scan_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        is_valid, reason, seal_info = verify_audit_record(data)
        return {
            "scan_id": scan_id,
            "verified": is_valid,
            "status": "VALID" if is_valid else "TAMPERED",
            "message": reason,
            "attestation": seal_info
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification check failed: {str(e)}")


@app.post("/api/verify")
async def verify_arbitrary_payload(payload: Dict[str, Any]):
    """
    Verify any arbitrary audit payload containing an attestation_seal.
    Allows external auditors or third parties to upload/submit reports for offline verification.
    """
    try:
        is_valid, reason, seal_info = verify_audit_record(payload)
        return {
            "verified": is_valid,
            "status": "VALID" if is_valid else "TAMPERED",
            "message": reason,
            "attestation": seal_info
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification check failed: {str(e)}")


@app.get("/api/compare", response_model=AuditComparisonResponse)
async def compare_scans(base_id: str = Query(..., description="Baseline scan ID (Scan A)"),
                        target_id: str = Query(..., description="Target scan ID (Scan B)")):
    """
    Compare two audit scans to evaluate compliance posture drift,
    remediation impact, and engine execution performance.
    """
    base_path = SCANS_DIR / f"{base_id}.json"
    target_path = SCANS_DIR / f"{target_id}.json"

    if not base_path.exists():
        raise HTTPException(status_code=404, detail=f"Baseline scan {base_id} not found")
    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Target scan {target_id} not found")

    try:
        with open(base_path, "r", encoding="utf-8") as f:
            base_data = json.load(f)
        with open(target_path, "r", encoding="utf-8") as f:
            target_data = json.load(f)

        # 1. Scores & Counts
        base_scores = base_data.get("scores", {})
        target_scores = target_data.get("scores", {})

        base_weighted = float(base_scores.get("weighted_score", 0))
        target_weighted = float(target_scores.get("weighted_score", 0))
        score_delta = round(target_weighted - base_weighted, 2)

        base_simple = float(base_scores.get("simple_score", 0))
        target_simple = float(target_scores.get("simple_score", 0))
        simple_score_delta = round(target_simple - base_simple, 2)

        base_passed = int(base_scores.get("passed", 0))
        target_passed = int(target_scores.get("passed", 0))
        passed_delta = target_passed - base_passed

        base_failed = int(base_scores.get("failed", 0))
        target_failed = int(target_scores.get("failed", 0))
        failed_delta = target_failed - base_failed

        base_errors = int(base_scores.get("errors", 0))
        target_errors = int(target_scores.get("errors", 0))

        # 2. Performance & Latency Deltas
        base_latency = base_data.get("execution_time") or base_scores.get("execution_time")
        target_latency = target_data.get("execution_time") or target_scores.get("execution_time")

        latency_delta = None
        speedup_percent = None
        base_throughput = None
        target_throughput = None
        throughput_delta = None

        if base_latency is not None and target_latency is not None:
            base_latency = float(base_latency)
            target_latency = float(target_latency)
            latency_delta = round(target_latency - base_latency, 3)
            if base_latency > 0:
                speedup_percent = round(((base_latency - target_latency) / base_latency) * 100, 1)

            base_rules_count = len(base_data.get("results", []))
            target_rules_count = len(target_data.get("results", []))

            if base_latency > 0 and base_rules_count > 0:
                base_throughput = round(base_rules_count / base_latency, 2)
            if target_latency > 0 and target_rules_count > 0:
                target_throughput = round(target_rules_count / target_latency, 2)
            if base_throughput is not None and target_throughput is not None:
                throughput_delta = round(target_throughput - base_throughput, 2)

        # 3. Rule-by-rule diff
        base_results_map = {r["rule_id"]: r for r in base_data.get("results", [])}
        target_results_map = {r["rule_id"]: r for r in target_data.get("results", [])}

        all_rule_ids = list(dict.fromkeys(list(base_results_map.keys()) + list(target_results_map.keys())))

        rule_diffs = []
        remediated_count = 0
        regressed_count = 0
        persistent_fail_count = 0
        unchanged_pass_count = 0
        error_count = 0

        # Category shifts mapping
        cat_map = {}

        for rid in all_rule_ids:
            b_r = base_results_map.get(rid, {})
            t_r = target_results_map.get(rid, {})

            category = t_r.get("category") or b_r.get("category", "General")
            description = t_r.get("description") or b_r.get("description", "")
            severity = t_r.get("severity") or b_r.get("severity", "MEDIUM")
            mitre_tactic = t_r.get("mitre_tactic") or b_r.get("mitre_tactic", "N/A")
            mitre_technique = t_r.get("mitre_technique") or b_r.get("mitre_technique", "N/A")

            b_stat = b_r.get("status", "UNKNOWN")
            t_stat = t_r.get("status", "UNKNOWN")

            b_time = b_r.get("execution_time")
            t_time = t_r.get("execution_time")
            r_lat_delta = None
            if b_time is not None and t_time is not None:
                r_lat_delta = round(float(t_time) - float(b_time), 3)

            # Determine diff type
            if b_stat == "FAIL" and t_stat == "PASS":
                diff_type = "REMEDIATED"
                remediated_count += 1
            elif b_stat == "PASS" and t_stat == "FAIL":
                diff_type = "REGRESSED"
                regressed_count += 1
            elif b_stat == "FAIL" and t_stat == "FAIL":
                diff_type = "PERSISTENT_FAIL"
                persistent_fail_count += 1
            elif b_stat == "PASS" and t_stat == "PASS":
                diff_type = "UNCHANGED_PASS"
                unchanged_pass_count += 1
            else:
                diff_type = "ERROR"
                error_count += 1

            rule_diffs.append(RuleDiffItem(
                rule_id=rid,
                category=category,
                description=description,
                severity=severity,
                mitre_tactic=mitre_tactic,
                mitre_technique=mitre_technique,
                base_status=b_stat,
                target_status=t_stat,
                base_latency=b_time,
                target_latency=t_time,
                latency_delta=r_lat_delta,
                diff_type=diff_type
            ))

            # Track Category stats
            if category not in cat_map:
                cat_map[category] = {
                    "base_passed": 0, "base_total": 0,
                    "target_passed": 0, "target_total": 0
                }
            if b_stat == "PASS":
                cat_map[category]["base_passed"] += 1
            if b_stat != "UNKNOWN":
                cat_map[category]["base_total"] += 1

            if t_stat == "PASS":
                cat_map[category]["target_passed"] += 1
            if t_stat != "UNKNOWN":
                cat_map[category]["target_total"] += 1

        category_shifts = [
            CategoryShiftItem(
                category=cat,
                base_passed=vals["base_passed"],
                base_total=vals["base_total"],
                target_passed=vals["target_passed"],
                target_total=vals["target_total"],
                passed_delta=vals["target_passed"] - vals["base_passed"]
            )
            for cat, vals in sorted(cat_map.items())
        ]

        # 4. Anti-TOCTOU Seals Validation
        base_valid = False
        target_valid = False
        try:
            base_valid, _, _ = verify_audit_record(base_data)
        except Exception:
            pass

        try:
            target_valid, _, _ = verify_audit_record(target_data)
        except Exception:
            pass

        base_seal_hash = base_data.get("attestation_seal", {}).get("sha256_hash") if base_data.get("attestation_seal") else None
        target_seal_hash = target_data.get("attestation_seal", {}).get("sha256_hash") if target_data.get("attestation_seal") else None

        return AuditComparisonResponse(
            base_scan_id=base_id,
            target_scan_id=target_id,
            base_timestamp=base_data.get("timestamp", ""),
            target_timestamp=target_data.get("timestamp", ""),
            base_mode=base_data.get("mode", ""),
            target_mode=target_data.get("mode", ""),
            base_weighted_score=base_weighted,
            target_weighted_score=target_weighted,
            score_delta=score_delta,
            base_simple_score=base_simple,
            target_simple_score=target_simple,
            simple_score_delta=simple_score_delta,
            base_passed=base_passed,
            target_passed=target_passed,
            passed_delta=passed_delta,
            base_failed=base_failed,
            target_failed=target_failed,
            failed_delta=failed_delta,
            base_errors=base_errors,
            target_errors=target_errors,
            base_latency=base_latency,
            target_latency=target_latency,
            latency_delta=latency_delta,
            speedup_percent=speedup_percent,
            base_throughput=base_throughput,
            target_throughput=target_throughput,
            throughput_delta=throughput_delta,
            remediated_count=remediated_count,
            regressed_count=regressed_count,
            persistent_fail_count=persistent_fail_count,
            unchanged_pass_count=unchanged_pass_count,
            error_count=error_count,
            category_shifts=category_shifts,
            rule_diffs=rule_diffs,
            base_seal_valid=base_valid,
            target_seal_valid=target_valid,
            base_seal_hash=base_seal_hash,
            target_seal_hash=target_seal_hash
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


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

        # Check if the requested file exists directly in frontend dist
        file_path = FRONTEND_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)

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
