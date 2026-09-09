# Windows Security Misconfiguration Auditor

A host-based auditor: **Python** orchestrates, **PowerShell/WMI** collects data,
**YAML** defines the rules, results render as a live terminal table (Rich) and
an HTML report (Jinja2). Zero external agents — no Nmap/Wireshark.

## Project Structure

    win-security-auditor/
    => auditor.py
    | rules.yaml
    ├── templates/report_template.html
    ├── sample_output/audit_report.html
    ├── .gitignore
    └── README.md

## Setup

    python -m venv venv
    venv\Scripts\activate
    pip install pyyaml rich jinja2

## Run

    python auditor.py --demo      # no admin/Windows required, uses mock data
    python auditor.py             # live scan, run terminal as Administrator

Opens/generates `audit_report.html` with a color-coded compliance dashboard.

## Adding a New Rule

Edit `rules.yaml` — no code changes needed:

    - rule_id: WIN-SEC-011
      category: "Network Security"
      description: "Ensure the Public firewall profile is enabled"
      ps_command: "Get-NetFirewallProfile -Name Public | Select-Object Enabled | ConvertTo-Json"
      target_key: "Enabled"
      expected_value: 1
      severity: "HIGH"

## Notes

- Requires Administrator privileges for live mode (registry/WMI reads).
- PowerShell 5.1+ (ships with Windows 10/11).
- Read-only auditor — reports misconfigurations, does not auto-remediate.