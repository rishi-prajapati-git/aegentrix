# AEGENTRIX Frontend Dashboard (Next.js / React)

This directory houses the Security Operations Center (SOC) dashboard for **AEGENTRIX**.

## Getting Started

### Prerequisites
- Node.js >= 18.x
- npm or pnpm

### Quickstart
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend connects to the AEGENTRIX Backend API running on `http://localhost:8000`.

## Planned SOC Views
1. **Security Overview:** Real-time KPI counters (Allowed, Denied, Flagged, Escalated Operations).
2. **Agent Registry:** Display agent identities, assigned roles, and explicit permission matrices.
3. **Interactive Scenario Runner:** One-click triggers for legitimate workflows and adversarial attack cases.
4. **Audit Timeline:** Real-time stream of evaluated security operations with secret sanitization.
5. **Incident Correlation Inspector:** Multi-step exfiltration chain detections and temporal risk alerts.
6. **Policy Engine Explorer:** Active policy rules and verifiable administrative approval management.
