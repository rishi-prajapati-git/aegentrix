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
    payload_size_bytes: int = 0
    decision: str
    reason_code: str
    reason_description: str
    matched_policy_id: Optional[str] = None
    provenance: ProvenanceInfo = Field(default_factory=ProvenanceInfo)
    advisory_model_analysis: Optional[AdvisoryModelAnalysis] = None
    sanitized_metadata: Dict[str, Any] = Field(default_factory=dict)

class PaginatedAuditEventsResponse(BaseModel):
    events: List[AuditEvent] = Field(default_factory=list, description="Page of audit event records")
    next_cursor: Optional[str] = Field(None, description="Opaque cursor token to fetch the next page of events")
    prev_cursor: Optional[str] = Field(None, description="Opaque cursor token to fetch the previous page of events")
    has_more: bool = Field(False, description="Whether additional events exist past this page")
    total_count: int = Field(default=0, description="Total count of events matching current filters")
    limit: int = Field(default=50, description="Page size limit applied")

class Incident(BaseModel):
    incident_id: str
    timestamp: str
    severity: str = "HIGH"
    rule_name: str
    description: str
    workflow_id: str
    correlated_event_ids: List[str]
    affected_agents: List[str]
    status: str = "OPEN" # OPEN, CONTAINED, RESOLVED, DISMISSED
    updated_at: Optional[str] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
