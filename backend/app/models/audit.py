from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class ProvenanceInfo(BaseModel):
    caller_chain: List[str] = Field(default_factory=list, description="Call chain e.g. ['user', 'research_agent']")
    untrusted_input_origin: Optional[str] = Field(None, description="External origin of untrusted content")
    claims_approval_by: Optional[str] = Field(None, description="Natural language approval claims by agent")

class AdvisoryModelAnalysis(BaseModel):
    analysis_status: str = Field(..., description="COMPLETED, UNAVAILABLE, SKIPPED")
    provider: str
    model_name: str
    risk_score: float = 0.0
    flags: List[str] = Field(default_factory=list)
    latency_ms: float = 0.0
    summary: str = ""

class AuditEvent(BaseModel):
    event_id: str
    timestamp: str
    workflow_id: str
    correlation_id: str
    source_agent_id: str
    operation: str
    target_resource_or_recipient: str
    payload_classification: str = "CONFIDENTIAL"
    decision: str
    reason_code: str
    reason_description: str
    matched_policy_id: Optional[str] = None
    provenance: ProvenanceInfo = Field(default_factory=ProvenanceInfo)
    advisory_model_analysis: Optional[AdvisoryModelAnalysis] = None
    sanitized_metadata: Dict[str, Any] = Field(default_factory=dict)

class Incident(BaseModel):
    incident_id: str
    timestamp: str
    severity: str = "HIGH"
    rule_name: str
    description: str
    workflow_id: str
    correlated_event_ids: List[str]
    affected_agents: List[str]
    status: str = "OPEN" # OPEN, CONTAINED, DISMISSED
