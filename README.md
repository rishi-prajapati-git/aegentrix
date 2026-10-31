# AEGENTRIX — Secure Multi-Agent AI Coordination and Governance

> **"Trust no agent blindly. Govern every action."**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-green.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)]()
[![Implementation Progress](https://img.shields.io/badge/Roadmap-TODO.md-orange.svg)](TODO.md)

AEGENTRIX is a security and governance layer for multi-agent AI workflows. As AI systems evolve from isolated chatbots to multi-agent networks (where Research Agents, Finance Agents, and Communication Agents collaborate), traditional access controls are insufficient. Agents can exchange misleading instructions, fabricate approvals, reuse compromised context, and exfiltrate sensitive data.

AEGENTRIX enforces strict security boundaries by ensuring **every protected operation is gated through a deterministic policy enforcement engine**. The AI model's role is strictly advisory—it never grants access or acts as the authority.

---

## 🏛️ Architecture Overview

```text
User / Scenario Runner
        │
        ▼
Secure Orchestrator ─── Agent Registry & Policy Store
        │
        ▼
Agent Communication Gateway (PEP)
        │
        ├──── AI Security Analysis Adapter (Advisory Only)
        │
        ▼
Policy Enforcement Engine
        │
        ├──── Least-Privilege & Data Access Controls
        ├──── Separate Read vs. Transfer Disclosure Boundaries
        ├──── Verifiable Server-Side Approval Validation (Rejects Verbal Claims)
        ├──── Temporal Risk Correlation & Incident Engine
        │
        ▼
Authorized Synthetic Resource / Allowlisted Tool Boundary
        │
        ▼
Sanitized Audit Store & Incident Timeline ──► SOC Dashboard
```

---

## 🛡️ Core Security Invariants

1. **LLM is Advisory, Not Authority:** Language models may flag suspicious content or prompt injection, but application code enforces authorization. LLMs cannot grant permissions or bypass rules.
2. **Deterministic Default-Deny:** Unrecognized agents, undeclared resources, or unverified actions fail closed.
3. **Verifiable Server-Side Approvals:** Natural language claims (e.g., *"Admin Alice verbally approved this"*) are rejected. Approvals require verifiable cryptographic/server records with scoped expiration.
4. **Read vs. Disclosure Separation:** An agent permitted to read data is **not** automatically authorized to transfer or disclose it externally.
5. **Multi-Step & Temporal Correlation:** Individual low-risk requests are correlated over time to detect multi-stage exfiltration chains.
6. **Zero Secrets in Audit Logs & Prompts:** All credentials, keys, and tokens are strictly redacted prior to logging and LLM inspection.

---

## 📁 Repository Structure

```text
├── backend/                      # Python FastAPI Security Engine
│   ├── app/
│   │   ├── api/                  # REST API endpoints (/health, /api/scenarios, /api/events, etc.)
│   │   ├── core/                 # Config, security sanitization & secret redaction
│   │   ├── models/               # Pydantic schemas (Agent, Policy, Approval, Audit, Requests)
│   │   ├── services/
│   │   │   ├── agent_registry.py # Synthetic Agent Registry (Research, Finance, Comm, Ops)
│   │   │   ├── approval_manager.py# Verifiable administrative approval tokens
│   │   │   ├── audit_store.py    # Structured audit event & incident store
│   │   │   ├── gateway.py        # Central PEP gating all reads, transfers, tools
│   │   │   ├── model_adapter.py  # Advisory AI inspection with fail-safe fallback
│   │   │   ├── policy_engine.py  # Authoritative deterministic enforcement point
│   │   │   ├── scenario_runner.py# Orchestrator for benign & adversarial attack scenarios
│   │   │   └── temporal_analyzer.py # Temporal attack correlation engine
│   │   └── main.py               # FastAPI entrypoint
│   ├── tests/                    # Pytest test suite (13 passing invariant tests)
│   ├── requirements.txt          # Python dependencies
│   └── pytest.ini                # Pytest configuration
├── frontend/                     # Next.js / React SOC Dashboard Boilerplate
│   ├── package.json              # Dashboard dependencies
│   └── README.md                 # Frontend instructions
├── docs/                         # Problem Statement & Implementation Docs
│   ├── PROBLEM_STATEMENT.md
│   └── IMPLEMENTATION_INSTRUCTIONS.md
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore rules
├── LICENSE                       # Apache 2.0 License
└── README.md                     # Project documentation
```

---

## 🚀 Quickstart & Setup

### 1. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run automated security invariant tests
pytest

# Start the Backend API server
python -m uvicorn backend.app.main:app --reload --port 8000
```

Verify backend health at: `http://localhost:8000/health`
Interactive Swagger docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Dashboard will be accessible at: `http://localhost:3000`

---

## 👥 Hackathon Team Roles & Work Allocation (3-Member Team)

To maximize execution speed and ensure comprehensive coverage of hackathon evaluation criteria, the project responsibilities are divided among 3 distinct roles:

### 👤 Member 1: AI Security Architect & Policy Engine Lead

- **Primary Focus:** Security Boundaries, Policy Enforcement, Threat Modeling & Rule Engine.
- **Key Responsibilities:**
  1. **Policy Rules & Invariant Enforcement:** Expand granular access policies (`backend/app/services/policy_engine.py`) covering fine-grained resource and action scopes.
  2. **Temporal Correlation & Incident Detection:** Implement advanced correlation rules in `temporal_analyzer.py` (sliding window rate checks, repeated probing detections, token exfiltration heuristics).
  3. **Advisory Model Adapter & Prompt Injection Defenses:** Integrate Gemma / open-weight models via Ollama or HuggingFace API in `model_adapter.py`, ensuring fail-safe degraded mode.
  4. **Adversarial Test Suite:** Write security benchmarks and exploit tests in `backend/tests/` validating prompt injection resistance and zero-bypass invariants.

---

### 👤 Member 2: Backend Orchestrator & Systems Engineer

- **Primary Focus:** FastAPI Core, Agent Workflows, API Surface & Data Persistence.
- **Key Responsibilities:**
  1. **Agent Coordination & Gateway:** Refine the inter-agent gateway (`backend/app/services/gateway.py`) to simulate authentic multi-agent communication rounds.
  2. **Database Persistence:** Transition SQLite / in-memory store (`audit_store.py`, `approval_manager.py`) with SQLAlchemy / aiosqlite for persistent audit retention.
  3. **Scenario Orchestration:** Expand reproducible scenarios in `scenario_runner.py` with dynamic parameters and reproducible seed states.
  4. **API & Integration:** Maintain FastAPI routes (`/api/scenarios/run`, `/api/events`, `/api/incidents`, `/api/approvals`), CORS handling, and payload sanitization.

---

### 👤 Member 3: Frontend Lead & SOC Dashboard Engineer

- **Primary Focus:** User Interface, Visual Exploit Timeline, Real-time SOC Dashboard & Demo.
- **Key Responsibilities:**
  1. **Next.js SOC Dashboard:** Build the web dashboard (`frontend/`) visualizing the Agent Registry, Active Policies, and System Metrics.
  2. **Interactive Attack Runner:** Create an intuitive UI to trigger the 7 scenarios with live progress and real-time response displays.
  3. **Security Audit Timeline:** Build an interactive event timeline with search, filtering, and decision reason popups.
  4. **Incident & Alert Graph:** Visualise multi-step attack chains showing how untrusted input was correlated and blocked.
  5. **Demo Polish & Pitch Preparation:** Coordinate the live demo script and presentation deck.

---

## 🧪 Scenarios Covered


| Scenario ID  | Name                           | Category    | Expected Outcome                                                 |
| -------------- | -------------------------------- | ------------- | ------------------------------------------------------------------ |
| `scenario-1` | Legitimate Research Workflow   | BENIGN      | **ALLOW** (Access authorized under least privilege)              |
| `scenario-2` | Prompt Injection in Document   | ADVERSARIAL | **DENY** (Advisory flags injection; policy blocks read)          |
| `scenario-3` | Fabricated Approval Claim      | ADVERSARIAL | **DENY** (Verbal claims rejected; token required)                |
| `scenario-4` | Unauthorized Cross-Agent Read  | ADVERSARIAL | **DENY** (Least-privilege boundary enforced)                     |
| `scenario-5` | Unauthorized External Transfer | ADVERSARIAL | **DENY** (Read authorized, but external transfer blocked)        |
| `scenario-6` | Multi-Step Exfiltration Chain  | ADVERSARIAL | **INCIDENT TRIGGERED** (Temporal analyzer correlates steps)      |
| `scenario-7` | AI Model Unavailable           | SYSTEM      | **FAIL-SAFE ACTIVE** (Deterministic policies remain 100% active) |

---

## 📜 License

Licensed under the [Apache License, Version 2.0](LICENSE).
