import argparse, json, subprocess, sys, os, platform
from datetime import datetime
import yaml
from jinja2 import Environment, FileSystemLoader
from rich.console import Console
from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn
from rich.table import Table
from rich.panel import Panel

console = Console()

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

def evaluate_rule(rule, demo=False):
    ok, payload = (run_powershell_demo(rule["rule_id"]) if demo else run_powershell(rule["ps_command"]))
    base = {
        "rule_id": rule["rule_id"], "category": rule["category"],
        "description": rule["description"], "severity": rule["severity"],
        "expected_value": rule["expected_value"],
    }
    if not ok:
        base.update(status="ERROR", actual_value=None, error=payload)
        return base
    actual_value = payload.get(rule["target_key"]) if isinstance(payload, dict) else payload
    status = "PASS" if actual_value == rule["expected_value"] else "FAIL"
    base.update(status=status, actual_value=actual_value, error=None)
    return base

def run_audit(rules, demo=False):
    results = []
    with Progress(TextColumn("[bold cyan]Auditing[/bold cyan]"), BarColumn(),
                   TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                   TimeElapsedColumn(), console=console) as progress:
        task = progress.add_task("scan", total=len(rules))
        for rule in rules:
            results.append(evaluate_rule(rule, demo=demo))
            progress.advance(task)
    return results

STATUS_STYLE = {"PASS": "[bold green]PASS[/bold green]", "FAIL": "[bold red]FAIL[/bold red]", "ERROR": "[bold yellow]ERROR[/bold yellow]"}

def print_summary(results):
    table = Table(title="Security Misconfiguration Audit Results", show_lines=False)
    table.add_column("Rule ID", style="dim"); table.add_column("Category")
    table.add_column("Description", overflow="fold"); table.add_column("Severity")
    table.add_column("Status", justify="center")
    for r in results:
        table.add_row(r["rule_id"], r["category"], r["description"], r["severity"],
                      STATUS_STYLE.get(r["status"], r["status"]))
    console.print(table)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    console.print(Panel(
        f"[bold green]{passed} PASS[/bold green]   [bold red]{failed} FAIL[/bold red]   "
        f"[bold yellow]{errors} ERROR[/bold yellow]   / {len(results)} total checks", title="Summary"))

def generate_html_report(results, output_path, template_dir):
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("report_template.html")
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    html = template.render(
        results=results, generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        hostname=platform.node(), os_version=platform.platform(), total=len(results),
        passed=passed, failed=failed, errors=errors,
        score=round((passed / len(results)) * 100, 1) if results else 0)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    console.print(f"[bold cyan]HTML report saved to:[/bold cyan] {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Windows Security Misconfiguration Auditor")
    parser.add_argument("--rules", default="rules.yaml")
    parser.add_argument("--output", default="audit_report.html")
    parser.add_argument("--demo", action="store_true", help="Run with mock data, no Windows required")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    template_dir = os.path.join(base_dir, "templates")

    if not args.demo and platform.system() != "Windows":
        console.print("[bold yellow]Non-Windows OS detected — auto-enabling --demo mode.[/bold yellow]")
        args.demo = True

    console.print(Panel.fit(f"[bold]Windows Security Misconfiguration Auditor[/bold]\nMode: {'DEMO' if args.demo else 'LIVE'}", border_style="cyan"))

    rules = load_rules(args.rules)
    results = run_audit(rules, demo=args.demo)
    print_summary(results)
    generate_html_report(results, args.output, template_dir)

if __name__ == "__main__":
    main()