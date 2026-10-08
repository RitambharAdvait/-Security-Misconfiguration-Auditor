# Automated Host-Based Security Auditor for Windows Environment

[![FastAPI](https://img.shields.io/badge/FastAPI-v0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18%2F19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.12%2F3.13-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![CIS Benchmark](https://img.shields.io/badge/CIS%20Benchmark-Windows%2011%20v2.0.0-blue.svg)](https://www.cisecurity.org)
[![MITRE ATT&CK](https://img.shields.io/badge/MITRE%20ATT%26CK-v14%20Enterprise-red.svg)](https://attack.mitre.org)
[![RFC 8785](https://img.shields.io/badge/Integrity-RFC%208785%20%7C%20RSA--2048-brightgreen.svg)](https://www.rfc-editor.org/rfc/rfc8785)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An automated, high-performance host-level cybersecurity auditor and remediation engine engineered specifically for Windows endpoints (Windows 10/11 and Windows Server).

Inspired by the academic framework **ASArP** (*Automated Security Assessment & Audit of Remote Platforms using TCG-SCAP synergies*, Aslam et al., Elsevier JISA 2015), this system replaces heavyweight XML/SCAP parsers and multi-phase query bottlenecks with a **lightweight, parallelized 24-worker inspection engine**, **declarative YAML specifications**, **RFC 8785 canonical cryptographic signing**, and an **interactive enterprise React command center**.

---

## Table of Contents

- [Overview and Problem Statement](#overview-and-problem-statement)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Operational Workflow](#operational-workflow)
- [Audited Security Domains and Benchmark Rules](#audited-security-domains-and-benchmark-rules)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Installation and Quickstart](#installation-and-quickstart)
- [REST API Reference](#rest-api-reference)
- [Performance and Benchmark Evaluation](#performance-and-benchmark-evaluation)
- [Project Team](#project-team)
- [License and Acknowledgements](#license-and-acknowledgements)

---

## Overview and Problem Statement

Modern cyberattacks rarely attempt to break robust mathematical encryption; adversaries routinely exploit simple operational omissions, such as disabled BitLocker, unhardened Remote Desktop (RDP) listeners, deprecated SMBv1 protocols, weak UAC token filtering, or disabled Windows Defender protections.

### Limitations of Traditional Solutions (ASArP / OpenSCAP):
1. **Linux Coupling:** Prior frameworks like ASArP heavily relied on Linux-specific subsystems (`Linux-IMA`, `GRUB-IMA`, `TrouSerS`), leaving Windows workstations unaddressed.
2. **Severe Latency:** Academic multi-phase CPE-to-NVD translation pipelines required up to **40 minutes** per scan cycle.
3. **Passive XML Outputs:** Legacy SCAP tools generated static, unactionable XML/XCCDF reports without deployable remediation scripts.
4. **Log Tampering Risks:** Unsigned audit logs saved to disk can be covertly manipulated by malicious local actors or malware to falsely claim compliance.

### The Proposed Solution:
The **Automated Host-Based Security Auditor for Windows Environment** bridges this gap:
- Executes **50 deterministic checks** in parallel (~4.13 s core execution).
- Embeds **MITRE ATT&CK Enterprise Matrix (v14)** mappings directly in each check.
- Protects scan artifacts using **RFC 8785 JSON canonicalization** and **RSA-2048 / SHA-256 digital signatures**.
- Automatically generates **elevated PowerShell remediation scripts (`.ps1`)** and **executive-grade PDF compliance playbooks**.

---

## Key Features

- **24-Worker Parallel Execution Engine:** Dispatches non-blocking, isolated PowerShell subprocesses (`-NoProfile -NonInteractive`) across physical/logical cores, querying registry hives, WMI/CIM, and LSA concurrently.
- **50 CIS Windows 11 Benchmarks:** Covers 19 Critical, 25 High, and 6 Medium controls aligned with CIS Benchmark v2.0.0 and MITRE ATT&CK tactics (T1078, T1021, T1562, T1557, T1068, T1003).
- **RFC 8785 and RSA-2048 Cryptographic Attestation:** Canonicalizes findings in memory to enforce deterministic key sorting and signs the payload with RSA-2048/SHA-256 before disk persistence, rendering post-scan file tampering mathematically detectable.
- **Automated Remediation Hub:** Compiles detected vulnerabilities into executable PowerShell `.ps1` scripts with structured `try/catch` blocks, progress counters, and elevation verification, alongside 4-column vector PDF playbooks.
- **Scan Comparison and Drift Analysis:** Side-by-side historical audit diffing evaluating transitions across a 4-state matrix: `REMEDIATED`, `REGRESSED`, `PERSISTENT_FAIL`, and `UNCHANGED_PASS`.
- **Interactive Rule and Benchmark Studio:** Allows real-time policy adjustments via RESTful CRUD endpoints with live PowerShell testing and a 35-check benchmark catalog (CIS, NIST SP 800-53, DISA STIG).
- **Command Center UI with Theme Toggle and About Hub:** Enterprise Cyber Dark and high-contrast Enterprise Light themes with custom HUD gauges, collapsible navigation sidebar (`WIN-SEC AUDITOR`), and an integrated **About Hub** highlighting project architecture, operational problem/solution metrics, and engineering team profiles.

---

## System Architecture

The platform follows a decoupled, asynchronous client-server architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REACT 19 / VITE WEB DASHBOARD                         │
│  ┌──────────────────────┬───────────────────────┬────────────────────────┐  │
│  │  Executive Overview  │   Security Findings   │   Benchmark Studio     │  │
│  ├──────────────────────┼───────────────────────┼────────────────────────┤  │
│  │   Scan Comparison    │   Historical Scans    │   Remediation Hub      │  │
│  ├──────────────────────┴───────────────────────┴────────────────────────┤  │
│  │       Cryptographic Attestation        •        About & Team          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON / HTTP)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI / UVICORN BACKEND                           │
│  • Pydantic v2 Contract Validation      • RESTful Rule Management (CRUD)    │
│  • Historical Diff Engine               • Cryptographic Verification API    │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     CONCURRENT AUDIT ENGINE          │  │     CRYPTOGRAPHIC CERTIFIER       │
│  (concurrent.futures.ThreadPool)     │  │  • RFC 8785 Canonicalization      │
│  • 24 Worker Threads                 │  │  • SHA-256 Message Digest         │
│  • rules.yaml Declarative Manifest   │  │  • RSA-2048 PKCS#1 v1.5 Signature │
│  • Subprocess Watchdogs (30s)        │  │  • certs/ Local Key Store         │
└───────────────────┬──────────────────┘  └───────────────────────────────────┘
                    │ Subprocess Execution (-NoProfile -NonInteractive)
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WINDOWS 10 / 11 TARGET HOST KERNEL                      │
│   [HKLM / HKCU Registry]  •  [WMI / CIM Providers]  •  [LSA Security Token] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Operational Workflow

```
STAGE 1: Rule Engine & Manifest Sync
  ├── Parse rules.yaml declarative specification (50 CIS rules)
  ├── Load MITRE ATT&CK tactic/technique mappings
  └── Sync active benchmark overrides and custom user rules
        │
        ▼ Validated Rules Array
STAGE 2: Parallel OS Inspection
  ├── Spawn 24-worker ThreadPoolExecutor
  ├── Dispatch non-interactive PowerShell subprocesses (-NoProfile)
  └── Query Windows Registry, WMI/CIM providers, and LSA policies in parallel
        │
        ▼ Raw JSON Findings & Per-Rule Latencies
STAGE 3: Evaluation, Scoring & Cryptographic Sealing
  ├── Assign PASS / FAIL / ERROR compliance statuses
  ├── Calculate simple percentage and risk-weighted score (Critical 3x, High 2x, Med 1x)
  ├── Normalize in-memory findings via RFC 8785 JSON Canonicalization
  └── Compute SHA-256 hash and sign with RSA-2048 private key (certs/asarp_private_key.pem)
        │
        ▼ Cryptographically Sealed Audit Artifact (scans/audit_*.json)
STAGE 4: Reporting, Drift Analysis & Remediation
  ├── Transmit payload via REST API to React client
  ├── Hydrate HUD metrics, SVG compliance gauge, and findings tables
  ├── Perform differential drift analysis against historical scans
  └── Generate elevated .ps1 remediation scripts and vector PDF playbooks
```

---

## Audited Security Domains and Benchmark Rules

The 50 rules (`WIN-SEC-001` through `WIN-SEC-050`) cover 5 key operational domains:

| Operational Domain | Rule ID Range | Severity Distribution | Sample Controls Audited |
| :--- | :---: | :---: | :--- |
| **Credential Protection & LSASS** | `007, 013, 021–026` | 6 Critical, 2 High | Credential Guard (VBS LSA isolation), LM Hash suppression, NTLMv2-only enforcement, WDigest caching prevention, Anonymous SAM enumeration blocks. |
| **Privilege Escalation & UAC** | `002, 011–012, 027–032` | 5 Critical, 4 High | UAC EnableLUA, AlwaysInstallElevated MSI root bypass denial, Secure Desktop prompts, Standard user elevation auto-deny, Admin approval token filtering. |
| **Lateral Movement & Network** | `001, 003, 014, 019–020, 033–038` | 3 Critical, 8 High | SMBv1 protocol suppression, SMB Client & Server signing, RDP Network Level Authentication (NLA), Remote Registry disablement, LLMNR broadcast suppression. |
| **Defense Evasion & Defender** | `004, 006, 017, 039–044` | 4 Critical, 5 High | Microsoft Defender Real-Time Protection, Tamper Protection, Behavioral Monitoring heuristics, IOAV attachment scanning, Controlled Folder Access (Anti-Ransomware). |
| **System Integrity & Auditing** | `005, 008–010, 015–016, 018, 045–050` | 1 Critical, 6 High, 6 Medium | Virtualization-Based Security (VBS), HVCI memory integrity, BitLocker full drive encryption, PowerShell Module/Transcription logging, Process Creation (Event ID 4688) command-line auditing. |

---

## Repository Structure

```
win-security-auditor/
├── backend/
│   ├── main.py                     # FastAPI REST API endpoints, routing & CORS
│   ├── requirements.txt            # Python dependencies (FastAPI, cryptography, etc.)
│   └── test_api.py                 # API automated endpoint unit tests
├── benchmarks/
│   └── catalog.json                # 35-check multi-standard benchmark catalog (CIS, NIST, DISA)
├── certs/
│   ├── asarp_private_key.pem       # RSA-2048 private signing key (PKCS#8)
│   └── asarp_public_key.pem        # RSA-2048 public certificate for verification
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Complete React command center, views & About Hub
│   │   ├── index.css               # Cyberpunk & enterprise light theme styling
│   │   └── main.jsx                # Client application bootstrap
│   ├── index.html                  # Single-page application root
│   ├── package.json                # Frontend dependencies (React, Vite, jsPDF, Axios)
│   ├── tailwind.config.js          # Extended color palette & custom themes
│   └── vite.config.js              # Vite bundler configuration
├── scans/                          # Cryptographically sealed JSON scan artifacts
├── scripts/
│   └── generate_report.py          # Corporate executive documentation synthesis
├── templates/
│   └── report_template.html        # Jinja2 HTML report template fallback
├── auditor.py                      # Core Python audit engine & 24-worker ThreadPool
├── certifier.py                    # RFC 8785 canonicalization & RSA-2048 signing module
├── LICENSE                         # MIT Open Source License
├── rules.yaml                      # Active declarative 50-rule benchmark specification
├── rules_default.yaml              # Factory fallback benchmark specification
├── start_dashboard.bat             # 1-Click launcher automation script
└── README.md                       # Comprehensive system documentation
```

---

## Tech Stack

### Backend and Core Audit Engine
- **Language and Runtime:** Python 3.12 / 3.13 (64-bit)
- **Web API Framework:** FastAPI v0.110+ (Starlette, Pydantic v2 validation)
- **ASGI Server:** Uvicorn v0.29+
- **Concurrency:** `concurrent.futures.ThreadPoolExecutor` (24 parallel workers)
- **Host Interoperability:** Windows PowerShell 5.1 / 7.0, WMI / CIM Providers, Windows Registry
- **Cryptography:** Python `cryptography` (RSA-2048, SHA-256, PKCS#1 v1.5, RFC 8785 canonicalization)

### Frontend Command Center
- **UI Framework:** React 18 / 19 (Functional Components, Custom Hooks)
- **Bundler and Dev Server:** Vite 8.3+
- **Styling:** Tailwind CSS 3.4+ with custom Cyber Dark and Enterprise Light themes
- **Icons:** Lucide React
- **HTTP Client:** Axios v1.6+
- **Vector Document Synthesis:** jsPDF v2.5+ & jspdf-autotable v3.8+ (Client-side PDF compilation)

---

## Installation and Quickstart

### Prerequisites
- **Operating System:** Windows 10, Windows 11, or Windows Server 2019/2022
- **Privileges:** Administrator privileges required for live audit mode (registry and WMI reads)
- **PowerShell:** Version 5.1+ (default on Windows 10/11)
- **Python:** Version 3.12 or 3.13 (64-bit)
- **Node.js:** Version 18.x or 20.x+ with npm

---

### Step 1: Clone and Set Up Python Backend

Open an **Elevated PowerShell terminal (Run as Administrator)**:

```powershell
# 1. Navigate to the project root
cd C:\win-security-auditor

# 2. Create and activate a Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r backend\requirements.txt
pip install pyyaml rich jinja2 cryptography pydantic fastapi uvicorn
```

---

### Step 2: Set Up and Build React Frontend

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install node dependencies
npm install

# 3. Build optimized production bundle
npm run build
```

---

### Step 3: Launch Services

#### Option A: One-Click Startup (Recommended)

Run the automated startup batch file from an **Elevated PowerShell** or by double-clicking:

```powershell
.\start_dashboard.bat
```
This automatically verifies the virtual environment, binds FastAPI, and opens the compiled enterprise dashboard at **`http://localhost:8000`**.

#### Option B: Developer Mode (Hot-Reloading)

1. **Start the FastAPI Backend (Port 8000):**
   ```powershell
   .\venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start the Vite Frontend Dev Server (Port 5173):**
   ```powershell
   cd frontend
   npm run dev
   ```

3. Open your browser at **`http://localhost:5173`**.

#### Option C: Run Standalone CLI Terminal Auditor

You can run the audit engine directly in your terminal without starting the web servers:

```powershell
# Run in Demo Simulation Mode (mock responses, no admin required):
python auditor.py --demo

# Run in Live Host Mode (requires elevated Administrator terminal):
python auditor.py
```

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint returning API operational status, service name, and framework version. |
| `GET` | `/api/audit?demo={bool}` | Trigger an audit scan. `demo=false` executes a live host audit; `demo=true` runs mock evaluation. |
| `GET` | `/api/history?limit={n}` | Retrieve chronological scan history list with scores, execution modes, and attestation seals. |
| `GET` | `/api/results/{scan_id}` | Retrieve complete findings payload for a specific historical audit artifact. |
| `GET` | `/api/verify/{scan_id}` | Recalculate RFC 8785 canonical hash and verify the RSA-2048 digital signature of a saved audit log. |
| `POST` | `/api/verify` | Verify an arbitrary uploaded JSON scan record against the TCB-sealed public key. |
| `GET` | `/api/compare?base_id={id}&target_id={id}` | Perform side-by-side differential drift analysis between two scans (remediated, regressed, deltas). |
| `GET` | `/api/rules` | Retrieve all 50 security rules in standard schema for scanning. |
| `GET` | `/api/rules/manage` | Retrieve active rules list from `rules.yaml` with custom/builtin status and toggle states. |
| `POST` | `/api/rules` | Create and register a new custom security rule in `rules.yaml`. |
| `PUT` | `/api/rules/{rule_id}` | Update existing security rule parameters, severity, or PowerShell query. |
| `PATCH` | `/api/rules/{rule_id}/toggle` | Enable or disable a specific security rule in future scans. |
| `DELETE` | `/api/rules/{rule_id}` | Delete a custom or imported rule from `rules.yaml`. |
| `POST` | `/api/rules/test-query` | Execute and test a live PowerShell inspection snippet in memory before saving. |
| `POST` | `/api/rules/reset` | Restore `rules.yaml` back to factory default baselines (`rules_default.yaml`). |
| `GET` | `/api/rules/stats` | Retrieve aggregate counts by category, severity distribution, and active/disabled states. |
| `GET` | `/api/benchmarks/catalog` | Browse pre-configured catalog of 35 security controls across CIS, NIST SP 800-53, and DISA STIG. |
| `POST` | `/api/benchmarks/import/{catalog_id}` | One-click import and activation of an industry benchmark check into the active rule set. |

---

## Performance and Benchmark Evaluation

Evaluations conducted on an **AMD Ryzen 7 8845HS** (8 cores / 16 threads, 16 GB RAM) running Windows 11 Enterprise:

### 1. Concurrency Optimization (Sequential vs. Parallel)

| Run Iteration | Baseline Sequential Execution | 24-Worker Parallel Execution | Speedup Factor |
| :---: | :---: | :---: | :---: |
| **Run 1** | 15.22 s | 4.10 s | **3.71×** |
| **Run 2** | 15.09 s | 3.99 s | **3.78×** |
| **Run 3** | 15.60 s | 3.97 s | **3.92×** |
| **Run 4** | 15.35 s | 4.30 s | **3.56×** |
| **Run 5** | 16.57 s | 4.27 s | **3.88×** |
| **Mean (σ)** | **15.55 s (± 0.58 s)** | **4.13 s (± 0.16 s)** | **~3.76× Speedup** |

### 2. Operational Boundary Latency

- **Core Audit Engine Latency (~4.13 s – 4.35 s):** Measures raw parallel execution across 50 rules with warm OS caches.
- **End-to-End System Pipeline Latency (~9.5 s – 11.8 s):** Measures the complete production web request cycle: HTTP network dispatch, cold PowerShell runtime initialization, WMI provider synchronization (BitLocker and Firewall queries), RFC 8785 canonicalization, RSA-2048 digital signing, disk persistence in `scans/`, and React DOM hydration.
- **Comparison with Academic Baseline (ASArP):** Compresses multi-phase compliance evaluation from up to **40 minutes** down to **seconds**.

---

## Project Team

| # | Team Member | Registration Number | Contact & Profiles |
| :-: | :--- | :---: | :--- |
| 1 | **Priyal Maheshwari** | `25BCY10089` | [Email](mailto:primaheshwari20@gmail.com) • [LinkedIn](https://www.linkedin.com/in/priyal-maheshwari-4344b93ba) |
| 2 | **Ritambhar Advait** | `25BCY10086` | [Email](mailto:ritambharadvait2007@gmail.com) • [LinkedIn](https://www.linkedin.com/in/ritambhar-advait-0b3b2137b) |
| 3 | **Harsh Vardhan Singh** | `25BCY10124` | [Email](mailto:harshranita123@gmail.com) • [LinkedIn](https://www.linkedin.com/in/harsh-vardhan-singh-918889380) |
| 4 | **Lakshya Nath** | `25BCY10109` | [Email](mailto:lakshyanath19@gmail.com) • [LinkedIn](https://www.linkedin.com/in/lakshya-nath-501441398) |
| 5 | **Harshvardhan Rathore** | `25BCY10085` | [Email](mailto:harshvardhan2007ak@gmail.com) • [LinkedIn](https://www.linkedin.com/in/harshvardhan-singh-rathore-3444b5375/) |

---

## License and Acknowledgements

- **Research Reference:** Based upon architectural concepts introduced in *"Automated Security Assessment & Audit of Remote Platforms using TCG-SCAP synergies"* (Aslam et al., **Elsevier Journal of Information Security and Applications**, 2015).
- **Standards Implemented:**
  - Center for Internet Security (CIS) Microsoft Windows 11 Benchmark v2.0.0
  - MITRE ATT&CK Enterprise Matrix v14
  - IETF RFC 8785: JSON Canonicalization Scheme (JCS)
  - NIST Special Publication 800-53 (Rev. 5)
- **License:** Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete terms, permissions, and conditions.