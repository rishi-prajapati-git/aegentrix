# AEGENTRIX — Implementation Instructions for the Coding Agent

You are acting as a senior security engineer, backend engineer, frontend engineer, and test engineer. Build a working, reviewable MVP of AEGENTRIX: a governance layer for multi-agent AI workflows. Do not stop at a design proposal, a roadmap, or mock UI. Inspect the repository, implement the smallest coherent end-to-end system, and verify it with real tests.

## 1. Mission

Implement a demonstration system that shows three agents collaborating under independent permissions while a trusted enforcement layer prevents unauthorized reads, data transfers, and tool calls. Include AI-assisted analysis of untrusted content if a supported model/provider can be configured, but ensure deterministic policy checks remain authoritative.

The system must demonstrate:

1. A legitimate operation that succeeds.
2. Prompt injection or malicious instructions embedded in untrusted content.
3. A fabricated approval claim from one agent to another.
4. An unauthorized cross-agent data access or data-transfer attempt.
5. A multi-step attack that is identified by correlating events.
6. An audit timeline that explains what happened and why an operation was allowed, denied, or escalated.

Do not claim that a prototype eliminates all prompt injection or secures every agent framework.

## 2. Repository-First Workflow

Before changing code:

- Inspect the repository tree, Git status, recent history, dependency manifests, app entry points, and existing tests.
- Identify the actual frontend/backend architecture and reuse established conventions where reasonable.
- Preserve all existing user changes. Never reset, clean, force-checkout, or overwrite unrelated work.
- Identify existing application routes and API contracts before modifying them.
- Check installed runtimes and run the current test/build commands to establish a baseline.
- If the repository is empty, choose a small, maintainable structure and state the assumptions in the final report.

Implement in small, coherent steps. Do not add speculative infrastructure or unrelated features.

## 3. Suggested Stack — Adapt to the Existing Repository

Prefer the current stack if one already exists. If creating the project from scratch, use:

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS.
- **Backend:** Python with FastAPI and Pydantic.
- **Persistence:** SQLite for the local MVP; use a repository abstraction so a production database can be added later.
- **Tests:** pytest for backend policy/scenario tests; existing frontend test tooling if available.
- **Model adapter:** configurable provider interface for an approved open-weight model or compatible Gemma endpoint. Keep provider code isolated from the policy engine.
- **Development:** `.env.example` with placeholders, `.gitignore`, lockfiles, and reproducible setup commands.

Do not install a large framework just to solve a small problem. Do not assume that a model, API key, GPU, database, or cloud service is available. The app must remain useful in deterministic demo mode when no model credentials are configured.

## 4. Security Invariants — Non-Negotiable

1. **The LLM is advisory, not the authority.** Model output may flag suspicious content or recommend escalation. It must not grant access, create approval, override policy, or directly execute protected operations.
2. **Every protected operation is gated.** Reads of restricted data, inter-agent transfers, and tool calls must pass through a trusted enforcement function. Do not implement a bypass path used by agents.
3. **Deny by default.** An unknown agent, unrecognized operation, unknown resource, missing policy, malformed approval, or failed authorization check must not be treated as allowed.
4. **Approval must be verifiable.** A statement such as “the administrator approved this” is not approval. For the MVP, model approvals as server-side records with unique IDs, actor, scope, action, expiry, and status. Validate the record in code.
5. **Least privilege.** Each demo agent gets only its explicit capabilities. Delegation must not increase the original caller's permissions unless a separately validated policy allows it.
6. **No raw secrets in model context.** Never pass API keys, passwords, session tokens, database URLs, or credentials into prompts, model messages, browser output, or ordinary audit records.
7. **Do not execute model-generated code.** Tool calls must map to a fixed, allowlisted set of typed functions and validated parameters.
8. **Use synthetic data.** No real customer, employee, financial, or other sensitive records in the demo.
9. **Sanitize audit data.** Log event metadata and bounded/redacted excerpts as needed; avoid recording entire confidential payloads.
10. **Model failure must not disable policy enforcement.** If the model is unavailable, deterministic authorization remains active. If a scenario depends on model analysis, show a clear unavailable/degraded status instead of fabricating a result.

## 5. Core Components

Keep these responsibilities separated, whether implemented as modules or services:

### A. Agent registry

Stores each agent's ID, display name, role, and explicitly permitted actions/resources. Use server-owned definitions, not permissions supplied by the caller.

### B. Policy engine

Implement a small, testable function/service that receives a typed request containing:

- `request_id` and `workflow_id`
- `source_agent_id`
- target resource or recipient
- requested operation
- purpose/context metadata
- relevant data classification
- optional verifiable approval reference

Return a structured decision such as `ALLOW`, `DENY`, or `REQUIRE_APPROVAL`, along with stable reason codes. The policy engine must not call an LLM to decide basic authorization.

### C. Secure orchestrator

Runs named scenarios and sends agent requests through the policy gateway. Agents must not access protected repositories or tools directly.

### D. Model-analysis adapter

Expose a typed interface such as `analyze_untrusted_content(...)`. It may return a risk label, reasons, and provider metadata. Treat that result as an untrusted advisory signal. Validate its schema, constrain input size, apply timeouts, and record whether analysis was completed or unavailable.

Use environment configuration for providers and model identifiers. Do not hardcode API keys. If no provider is configured, use an explicitly labelled deterministic fallback for demo classification—not a fake claim that an LLM ran.

### E. Communication and data-flow gateway

Check the requesting agent, intended recipient, resource sensitivity, purpose, and policy before transferring data. Reading data and disclosing it are separate permissions. A source agent's permission to read a record does not automatically authorize forwarding it to any other agent or external recipient.

### F. Temporal risk correlation

Implement at least one clear, deterministic sequence rule across events, for example:

- repeated denied attempts to access the same restricted resource across agents;
- an untrusted prompt-injection event followed by a request for restricted data and then an external transfer attempt;
- a sequence of small data reads whose cumulative scope crosses an explicit demo threshold.

Keep thresholds configurable. Explain which events caused the alert. Do not label a pattern as detected unless the event sequence actually occurred.

### G. Audit event store

Store structured events with an event ID, timestamp, workflow/correlation ID, source agent, operation, resource classification, policy decision, reason code, model-analysis status if applicable, and response. Redact secrets. Do not put raw credentials or complete private data in logs.

### H. Frontend dashboard

Provide a simple, polished security operations interface that supports running the scenarios and inspecting results. Avoid a static mockup: scenario buttons must call the backend and display the real response returned by the executed policy/scenario logic.

## 6. Required Demo Agents and Data

Implement three or four clearly isolated synthetic agents:

- **Research Agent:** can read public/approved research documents; cannot read restricted finance data or send sensitive information externally.
- **Finance Agent:** can read synthetic restricted finance data; can disclose only to explicitly authorized recipients for approved purposes.
- **Communication Agent:** can draft external messages; cannot independently read restricted finance records.
- **Operations Agent (optional):** can execute a narrow, allowlisted non-destructive action.

Use simple fake records marked as synthetic. Do not rely on frontend-only checks; all access decisions must happen server-side.

## 7. Required Scenarios

Implement these as reproducible backend scenarios and expose them in the UI:

### Scenario 1 — Legitimate workflow

An authorized agent reads an approved document and sends a permitted summary to an authorized recipient. Expected: allow; audit entries are created.

### Scenario 2 — Prompt injection in a document

A synthetic document contains instructions to ignore rules and retrieve/send confidential data. Mark the content as untrusted. AI analysis may flag it, but the policy engine must independently deny any prohibited data access or transfer.

### Scenario 3 — Fabricated approval

One agent tells another that an administrator approved a restricted operation. No valid approval record exists. Expected: deny with a stable reason code such as `APPROVAL_NOT_VERIFIED`.

### Scenario 4 — Unauthorized cross-agent read

The Research or Communication Agent attempts to read finance-only data. Expected: deny with a least-privilege reason code.

### Scenario 5 — Unauthorized external disclosure

An agent that can read a synthetic restricted record tries to send it to an unapproved recipient. Expected: transfer denied even if the source agent can read the record.

### Scenario 6 — Multi-step attack

Run a sequence that includes an untrusted instruction, one or more related unauthorized requests, and a restricted outbound transfer attempt. Correlate the events and raise a visible incident. Verify that the prohibited operation is blocked.

### Scenario 7 — Model unavailable

Simulate a missing or failed model provider. Expected: show degraded/unavailable analysis clearly; continue enforcing deterministic policies and do not claim the model inspected the input.

Tests may cover additional cases, especially revocation, malformed input, unknown agent IDs, and unexpected policy errors.

## 8. Suggested API Surface

Adapt paths to the existing app. All endpoints need input validation and predictable error responses. Possible routes:

- `GET /health` — service health and non-sensitive configuration status.
- `GET /api/agents` — list demo agents and capabilities safe to display.
- `GET /api/policies` — list active demo policies without secrets.
- `GET /api/scenarios` — list available scenarios.
- `POST /api/scenarios/{scenario_id}/run` — run one bounded scenario and return workflow/correlation ID, outcome, and event references.
- `GET /api/events` — filtered, paginated audit events.
- `GET /api/incidents` — detected incidents and their correlated events.
- `POST /api/approvals` — create a bounded demo approval only through an authorized administrative path; never let an ordinary agent self-approve.

Do not expose internal secrets, unrestricted raw payloads, or arbitrary tool execution through APIs. Apply request-size limits, validation, timeouts, and safe exception handling.

## 9. Suggested Frontend Experience

Build a focused dashboard with the following sections:

1. **Overview:** counts derived from actual stored events for allowed, denied, flagged, and escalated operations.
2. **Agent registry:** each synthetic agent's capabilities and explicitly denied resources.
3. **Scenario runner:** buttons for the required scenarios; show loading and error states.
4. **Decision result:** display the actual decision, reason code, affected agent/resource, and whether model analysis ran.
5. **Attack timeline:** ordered events grouped by workflow/correlation ID, with denied actions clearly distinguished from alerts.
6. **Incidents:** show correlated event chain, rationale, and current containment/approval status.
7. **Policy view:** show readable rules without exposing server secrets.

Use accessible contrast, semantic markup, visible keyboard focus, responsive layouts, and useful empty/error states. Do not fill the dashboard with hardcoded numbers or fabricate successful attacks. Every displayed metric must come from the actual backend or be clearly marked as illustrative.

## 10. Testing Requirements

Write meaningful automated tests for at least:

- authorized action succeeds;
- unknown agent is denied;
- unauthorized resource read is denied;
- unauthorized transfer is denied even if the source can read the data;
- natural-language approval claim is rejected without a valid approval record;
- valid, scoped, unexpired approval follows policy;
- model analysis cannot change a `DENY` to `ALLOW`;
- model unavailable does not bypass deterministic policy enforcement;
- temporal correlation emits an incident for the defined attack chain;
- secret values are not written to audit output;
- malformed inputs and unknown operations fail safely;
- permission revocation is re-evaluated for subsequent operations.

Use dependency injection or a fake provider in tests so the test suite does not require network access, a paid API key, or a GPU. Include one integration test that runs a complete scenario from API request through policy decision and audit events.

## 11. Dependency, Configuration, and Documentation Hygiene

- Pin or lock dependencies using the repository's normal conventions.
- Add `.env.example` with placeholder names only; never real values.
- Ensure `.env`, tokens, credentials, local database files, caches, build artifacts, and generated secrets are appropriately ignored by Git.
- Do not print secrets in command output or test logs.
- Do not create unnecessary markdown files for plans, agent instructions, helper notes, or roadmaps inside the tracked source repository. The current instructions and problem statement are working inputs; keep them outside the repository unless the project owner explicitly requests them in the repository. Preserve a useful root `README.md`, the applicable licence, and required submission documents.
- Do not blindly ignore every Markdown file. Preserve required README, legal, licence, and submission documentation.
- Do not create fake test results, fabricated performance claims, or placeholder features presented as complete.

## 12. Quality Gates and Verification

After implementation:

1. Run backend tests and report pass/fail counts.
2. Run frontend lint, type-check, and production build if the existing scripts support them.
3. Run the API and verify the health endpoint.
4. Exercise each required scenario through the real backend path.
5. Inspect the audit timeline to ensure it matches the actual event sequence.
6. Check that blocked actions do not reach the protected resource/tool.
7. Verify the UI at desktop and mobile sizes if browser tooling is available.
8. Check Git status and diffs to ensure unrelated user changes were preserved.
9. Search for leaked secrets, accidental local database files, and hardcoded sensitive values.
10. Make a final pass for unsafe defaults, missing validation, and misleading UI states.

If a quality gate cannot be run, state that explicitly and explain why. Do not claim success without evidence.

## 13. Implementation Order

Work in this order, adapting to the repository:

1. Repository audit and baseline checks.
2. Domain types, agent registry, and policy rules.
3. Protected synthetic data and a single authorization gateway.
4. Scenario orchestrator and structured audit events.
5. Required attack and legitimate scenarios with backend tests.
6. Temporal correlation rule and incident model.
7. Optional model adapter and explicit degraded mode.
8. API endpoints.
9. Functional dashboard wired to real API results.
10. End-to-end verification and cleanup.

Prioritize a small, secure vertical slice that works end-to-end over many incomplete screens or abstractions.

## 14. Definition of Done

The task is complete only when:

- A user can run at least one legitimate and four adversarial scenarios from the app or its documented API.
- Policy decisions happen on the trusted backend, not in browser code or LLM prompts.
- Unauthorized reads and transfers are actually blocked.
- A fabricated approval cannot authorize a protected operation.
- At least one multi-step sequence produces a traceable incident.
- The audit timeline reflects real events generated by the scenarios.
- Tests verify the critical security invariants.
- Model availability and model participation are represented honestly.
- Setup instructions work from a clean checkout to the extent permitted by available dependencies and credentials.

## 15. Final Report Format

At the end, report:

- What was implemented.
- Key files/modules created or changed.
- Which scenarios are runnable and how to run them.
- Exact test/build commands executed and their outcomes.
- Any remaining failures, limitations, assumptions, or unverified behaviors.
- Required environment variables and whether any provider credentials are necessary.

Do not finish with only a plan. Implement the working MVP, verify it, and report accurately.
