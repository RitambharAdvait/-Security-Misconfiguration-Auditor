import argparse, json, subprocess, sys, os, platform, time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import yaml
from jinja2 import Environment, FileSystemLoader
from rich.console import Console
from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn
from rich.table import Table
from rich.panel import Panel

console = Console()

# ---------------------------------------------------------------------------
# Severity weights for risk-weighted compliance scoring (mirrors CVSS/CCSS)
# ---------------------------------------------------------------------------
SEVERITY_WEIGHT = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1, "LOW": 1}

DEMO_RESPONSES = {
    "WIN-SEC-001": {"EnableSMB1Protocol": True},
    "WIN-SEC-002": {"EnableLUA": 1},
    "WIN-SEC-003": {"UserAuthentication": 0},
    "WIN-SEC-004": {"RealTimeProtectionEnabled": True},
    "WIN-SEC-005": {"Enabled": False},
    "WIN-SEC-006": {"Enabled": 1},
    "WIN-SEC-007": {"RunAsPPL": None},
    "WIN-SEC-008": {"ExecutionPolicy": "RemoteSigned"},
    "WIN-SEC-009": {"NoAutoUpdate": 0},
    "WIN-SEC-010": {"VolumeStatus": "FullyDecrypted"},
    "WIN-SEC-011": {"AlwaysInstallElevated": 0},
    "WIN-SEC-012": {"AlwaysInstallElevated": 1},
    "WIN-SEC-013": {"UseLogonCredential": 0},
    "WIN-SEC-014": {"EnableMulticast": 1},
    "WIN-SEC-015": {"NoDriveTypeAutoRun": 255},
    "WIN-SEC-016": {"Enabled": 1},
    "WIN-SEC-017": {"EnableScriptBlockLogging": 0},
    "WIN-SEC-018": {"Enabled": False},
    "WIN-SEC-019": {"RequireSecuritySignature": False},
    "WIN-SEC-020": {"Status": "Running"},
    "WIN-SEC-021": {"Enabled": 0},
    "WIN-SEC-022": {"NoLMHash": 1},
    "WIN-SEC-023": {"LmCompatibilityLevel": 5},
    "WIN-SEC-024": {"RestrictAnonymousSAM": 1},
    "WIN-SEC-025": {"CachedLogonsCount": "4"},
    "WIN-SEC-026": {"RestrictAnonymous": 1},
    "WIN-SEC-027": {"ConsentPromptBehaviorAdmin": 2},
    "WIN-SEC-028": {"ConsentPromptBehaviorUser": 0},
    "WIN-SEC-029": {"FilterAdministratorToken": 1},
    "WIN-SEC-030": {"EnableVirtualization": 1},
    "WIN-SEC-031": {"PromptOnSecureDesktop": 1},
    "WIN-SEC-032": {"ValidateAdminCodeSignatures": 0},
    "WIN-SEC-033": {"RequireSecuritySignature": True},
    "WIN-SEC-034": {"LimitBlankPasswordUse": 1},
    "WIN-SEC-035": {"Status": "Stopped"},
    "WIN-SEC-036": {"AllowBasic": 0},
    "WIN-SEC-037": {"AllowUnencryptedTraffic": 0},
    "WIN-SEC-038": {"MinEncryptionLevel": 3},
    "WIN-SEC-039": {"TamperProtection": 5},
    "WIN-SEC-040": {"DisableBehaviorMonitoring": False},
    "WIN-SEC-041": {"DisableIOAVProtection": False},
    "WIN-SEC-042": {"MAPSReporting": 2},
    "WIN-SEC-043": {"PUAProtection": 1},
    "WIN-SEC-044": {"EnableControlledFolderAccess": 0},
    "WIN-SEC-045": {"EnableVirtualizationBasedSecurity": 1},
    "WIN-SEC-046": {"Enabled": 1},
    "WIN-SEC-047": {"EnableModuleLogging": 0},
    "WIN-SEC-048": {"EnableTranscripting": 0},
    "WIN-SEC-049": {"ProcessCreationIncludeCmdLine_Enabled": 0},
    "WIN-SEC-050": {"EnableSmartScreen": 1},
}

def load_rules(path):
    if not os.path.exists(path):
        console.print(f"[bold red]Rules file not found:[/bold red] {path}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        rules = yaml.safe_load(f)
    if not rules:
        console.print("[bold red]No rules loaded. Check rules.yaml formatting.[/bold red]")
        sys.exit(1)
    return rules

def run_powershell(command: str):
    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command],
            capture_output=True, text=True, timeout=30,
        )
    except FileNotFoundError:
        return False, "powershell.exe not found (are you on Windows?)"
    except subprocess.TimeoutExpired:
        return False, "PowerShell command timed out"

    # Explicitly catch elevation / permission denied (e.g. BitLocker WMI namespace)
    if result.stderr and any(token in result.stderr for token in ("Access denied", "PermissionDenied", "0x80041003")):
        return False, "Requires Administrator privileges (Elevated token needed)"

    if result.returncode != 0:
        return False, result.stderr.strip() or "Non-zero exit code"
    stdout = result.stdout.strip()
    if not stdout:
        return False, "Empty stdout from PowerShell"
    try:
        return True, json.loads(stdout)
    except json.JSONDecodeError:
        return False, f"Failed to parse JSON: {stdout[:200]}"

def run_powershell_demo(rule_id: str):
    if rule_id in DEMO_RESPONSES:
        return True, DEMO_RESPONSES[rule_id]
    return False, "No demo data registered for this rule"

# ---------------------------------------------------------------------------
# Native Windows OS Default Baselines for Unconfigured Policy Registry Keys
# (Adheres to official CIS Microsoft Windows Benchmarks)
# When an administrative GPO registry key or property is absent ("Not Configured"),
# Windows applies its built-in kernel/subsystem default behavior.
# If an administrator configures the registry key live, the live value is audited.
# ---------------------------------------------------------------------------
GPO_UNCONFIGURED_DEFAULTS = {
    "WIN-SEC-009": 0,
    "WIN-SEC-011": 0,
    "WIN-SEC-012": 0,
    "WIN-SEC-013": 0,
    "WIN-SEC-014": 1,
    "WIN-SEC-017": 0,
    "WIN-SEC-021": 0,
    "WIN-SEC-022": 1,
    "WIN-SEC-023": 3,
    "WIN-SEC-024": 1,
    "WIN-SEC-025": "10",
    "WIN-SEC-026": 0,
    "WIN-SEC-027": 5,
    "WIN-SEC-028": 3,
    "WIN-SEC-029": 0,
    "WIN-SEC-030": 1,
    "WIN-SEC-031": 1,
    "WIN-SEC-032": 0,
    "WIN-SEC-034": 1,
    "WIN-SEC-036": 0,
    "WIN-SEC-037": 0,
    "WIN-SEC-038": 2,
    "WIN-SEC-042": 0,
    "WIN-SEC-043": 0,
    "WIN-SEC-044": 0,
    "WIN-SEC-045": 0,
    "WIN-SEC-046": 0,
    "WIN-SEC-047": 0,
    "WIN-SEC-048": 0,
    "WIN-SEC-049": 0,
    "WIN-SEC-050": 1,
}

def evaluate_rule(rule, demo=False):
    rule_id = rule["rule_id"]
    t0 = time.perf_counter()
    ok, payload = (run_powershell_demo(rule_id) if demo else run_powershell(rule["ps_command"]))
    duration = time.perf_counter() - t0
    rule_time = round(duration, 2) if duration >= 0.05 else round(max(duration, 0.001), 3)

    base = {
        "rule_id": rule_id,
        "category": rule["category"],
        "description": rule["description"],
        "severity": rule["severity"],
        "expected_value": rule["expected_value"],
        # Remediation & risk metadata (defaults for backward-compat with old rules)
        "risk_explanation": rule.get("risk_explanation", ""),
        "remediation_command": rule.get("remediation_command", ""),
        "cis_reference": rule.get("cis_reference", "N/A"),
        "mitre_tactic": rule.get("mitre_tactic", "N/A"),
        "mitre_technique": rule.get("mitre_technique", "N/A"),
        "mitre_name": rule.get("mitre_name", "N/A"),
        "execution_time": rule_time,
    }
    if not ok:
        # If failure is due to missing GPO path or empty stdout, evaluate authentic CIS OS default
        if rule_id in GPO_UNCONFIGURED_DEFAULTS and payload in ("Non-zero exit code", "Empty stdout from PowerShell"):
            actual_value = GPO_UNCONFIGURED_DEFAULTS[rule_id]
            status = "PASS" if actual_value == rule["expected_value"] else "FAIL"
            base.update(status=status, actual_value=actual_value, error=None)
            return base

        base.update(status="ERROR", actual_value=None, error=payload)
        return base

    actual_value = payload.get(rule["target_key"]) if isinstance(payload, dict) else payload

    # If registry key exists but target property is absent ($null), evaluate authentic CIS OS default
    if actual_value is None and rule_id in GPO_UNCONFIGURED_DEFAULTS:
        actual_value = GPO_UNCONFIGURED_DEFAULTS[rule_id]

    status = "PASS" if actual_value == rule["expected_value"] else "FAIL"
    base.update(status=status, actual_value=actual_value, error=None)
    return base

def run_audit(rules, demo=False):
    if demo:
        return [evaluate_rule(r, demo=True) for r in rules]

    results_dict = {}
    with Progress(TextColumn("[bold cyan]Auditing[/bold cyan]"), BarColumn(),
                   TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                   TimeElapsedColumn(), console=console) as progress:
        task = progress.add_task("scan", total=len(rules))
        max_workers = min(24, len(rules))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_idx = {executor.submit(evaluate_rule, rule, demo=False): idx for idx, rule in enumerate(rules)}
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                results_dict[idx] = future.result()
                progress.advance(task)

    return [results_dict[i] for i in range(len(rules))]

# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def compute_scores(results):
    """Return simple counts and risk-weighted compliance percentage."""
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    total  = len(results)

    # Simple percentage (backward-compatible)
    simple_score = round((passed / total) * 100, 1) if total else 0

    # Risk-weighted score: each rule's weight depends on its severity
    weighted_earned = 0
    weighted_possible = 0
    for r in results:
        w = SEVERITY_WEIGHT.get(r["severity"], 1)
        weighted_possible += w
        if r["status"] == "PASS":
            weighted_earned += w
    weighted_score = round((weighted_earned / weighted_possible) * 100, 1) if weighted_possible else 0

    return {
        "passed": passed, "failed": failed, "errors": errors, "total": total,
        "simple_score": simple_score, "weighted_score": weighted_score,
    }

# ---------------------------------------------------------------------------
# Terminal output
# ---------------------------------------------------------------------------

STATUS_STYLE = {"PASS": "[bold green]PASS[/bold green]", "FAIL": "[bold red]FAIL[/bold red]", "ERROR": "[bold yellow]ERROR[/bold yellow]"}

def print_summary(results, scores):
    table = Table(title="Security Misconfiguration Audit Results", show_lines=False)
    table.add_column("Rule ID", style="dim"); table.add_column("Category")
    table.add_column("Description", overflow="fold"); table.add_column("Severity")
    table.add_column("MITRE", style="cyan"); table.add_column("Status", justify="center")
    for r in results:
        table.add_row(r["rule_id"], r["category"], r["description"], r["severity"],
                      r["mitre_technique"], STATUS_STYLE.get(r["status"], r["status"]))
    console.print(table)
    console.print(Panel(
        f"[bold green]{scores['passed']} PASS[/bold green]   "
        f"[bold red]{scores['failed']} FAIL[/bold red]   "
        f"[bold yellow]{scores['errors']} ERROR[/bold yellow]   "
        f"/ {scores['total']} total checks\n"
        f"Simple Score: [bold]{scores['simple_score']}%[/bold]   "
        f"Risk-Weighted Score: [bold]{scores['weighted_score']}%[/bold]",
        title="Summary"))

# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def generate_html_report(results, scores, output_path, template_dir):
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("report_template.html")
    html = template.render(
        results=results,
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        hostname=platform.node(),
        os_version=platform.platform(),
        **scores,
    )
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    console.print(f"[bold cyan]HTML report saved to:[/bold cyan] {output_path}")

def save_scan_json(results, scores, scans_dir, demo, execution_time=None):
    """Persist audit results as timestamped JSON for history tracking, cryptographically sealed."""
    os.makedirs(scans_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    scan_record = {
        "timestamp": datetime.now().isoformat(),
        "hostname": platform.node(),
        "os_version": platform.platform(),
        "mode": "demo" if demo else "live",
        "execution_time": execution_time,
        "scores": scores,
        "results": results,
    }

    # Cryptographic attestation seal (Anti-TOCTOU)
    try:
        from certifier import sign_audit_record
        scan_record = sign_audit_record(scan_record)
    except Exception as e:
        console.print(f"[bold yellow]Warning: Cryptographic signing skipped: {e}[/bold yellow]")

    path = os.path.join(scans_dir, f"audit_{ts}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(scan_record, f, indent=2, default=str)
    console.print(f"[bold cyan]Scan history saved to:[/bold cyan] {path}")
    return path

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Windows Security Misconfiguration Auditor")
    parser.add_argument("--rules", default="rules.yaml")
    parser.add_argument("--output", default="audit_report.html")
    parser.add_argument("--demo", action="store_true", help="Run with mock data, no Windows required")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    template_dir = os.path.join(base_dir, "templates")
    scans_dir = os.path.join(base_dir, "scans")

    if not args.demo and platform.system() != "Windows":
        console.print("[bold yellow]Non-Windows OS detected — auto-enabling --demo mode.[/bold yellow]")
        args.demo = True

    console.print(Panel.fit(f"[bold]Windows Security Misconfiguration Auditor[/bold]\nMode: {'DEMO' if args.demo else 'LIVE'}", border_style="cyan"))

    rules = load_rules(args.rules)
    start_time = time.perf_counter()
    results = run_audit(rules, demo=args.demo)
    execution_time = round(time.perf_counter() - start_time, 2)
    scores = compute_scores(results)
    scores["execution_time"] = execution_time
    print_summary(results, scores)
    generate_html_report(results, scores, args.output, template_dir)
    save_scan_json(results, scores, scans_dir, demo=args.demo, execution_time=execution_time)

if __name__ == "__main__":
    main()
