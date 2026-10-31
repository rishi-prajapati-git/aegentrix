const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SystemMetrics {
  total_events: number;
  allowed_count: number;
  denied_count: number;
  escalated_count: number;
  flagged_signals_count: number;
  open_incidents_count: number;
}

export interface AgentCapability {
  allowed_operations: string[];
  allowed_resources: string[];
  allowed_destinations: string[];
  allowed_tools: string[];
}

export interface AgentModel {
  agent_id: string;
  name: string;
  role: string;
  trust_tier: string;
  capabilities: AgentCapability;
  explicitly_denied_resources: string[];
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
}

export interface ScenarioInfo {
  scenario_id: string;
  title: string;
  description: string;
  category: "BENIGN" | "ADVERSARIAL" | "SYSTEM";
  expected_outcome: string;
}

export interface AuditEvent {
  event_id: string;
  timestamp: string;
  workflow_id: string;
  correlation_id: string;
  source_agent_id: string;
  operation: string;
  target_resource_or_recipient: string;
  payload_classification: string;
  payload_size_bytes: number;
  decision: "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
  reason_code: string;
  reason_description: string;
  matched_policy_id?: string;
  provenance?: {
    caller_chain?: string[];
    untrusted_input_origin?: string;
    claims_approval_by?: string;
  };
  advisory_model_analysis?: {
    analysis_status: string;
    provider: string;
    model_name: string;
    risk_score: number;
    flags: string[];
    latency_ms: number;
    summary: string;
  };
  sanitized_metadata?: Record<string, any>;
}

export interface Incident {
  incident_id: string;
  timestamp: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  rule_name: string;
  description: string;
  workflow_id: string;
  correlated_event_ids: string[];
  affected_agents: string[];
  status: "OPEN" | "CONTAINED" | "RESOLVED" | "DISMISSED";
  updated_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface PolicyRule {
  policy_id: string;
  name: string;
  description: string;
  source_pattern: string;
  operation: string;
  resource_pattern: string;
  destination_pattern?: string;
  requires_verifiable_approval: boolean;
  decision: string;
  reason_code: string;
}

export async function fetchMetrics(): Promise<SystemMetrics> {
  const res = await fetch(`${BASE_URL}/api/metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function fetchAgents(): Promise<AgentModel[]> {
  const res = await fetch(`${BASE_URL}/api/agents`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function updateAgentStatus(agentId: string, status: string, reason?: string): Promise<any> {
  let res = await fetch(`${BASE_URL}/api/agents/${encodeURIComponent(agentId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reason }),
  });
  if (!res.ok) {
    res = await fetch(`${BASE_URL}/api/agents/${encodeURIComponent(agentId)}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
  }
  if (!res.ok) throw new Error("Failed to update agent status");
  return res.json();
}

export async function fetchScenarios(): Promise<ScenarioInfo[]> {
  const res = await fetch(`${BASE_URL}/api/scenarios`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch scenarios");
  return res.json();
}

export async function runScenario(scenarioId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/scenarios/${encodeURIComponent(scenarioId)}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Failed to execute scenario");
  return res.json();
}

export async function fetchEvents(limit = 50, cursor?: string, decision?: string): Promise<AuditEvent[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append("cursor", cursor);
  if (decision && decision !== "ALL") params.append("decision", decision);

  const res = await fetch(`${BASE_URL}/api/events?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${BASE_URL}/api/incidents`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function updateIncidentStatus(incidentId: string, status: string, notes?: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/incidents/${encodeURIComponent(incidentId)}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, actor: "sec-admin", notes }),
  });
  if (!res.ok) throw new Error("Failed to update incident status");
  return res.json();
}

export async function fetchPolicies(): Promise<PolicyRule[]> {
  const res = await fetch(`${BASE_URL}/api/policies`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch policies");
  return res.json();
}

export async function createApproval(data: {
  actor: string;
  target_agent_id: string;
  scope_resource: string;
  operation: string;
  destination?: string;
  duration_minutes: number;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/approvals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create approval token");
  return res.json();
}
