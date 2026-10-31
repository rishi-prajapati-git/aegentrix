from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from .audit import AuditEvent, Incident

class ScenarioInfo(BaseModel):
    scenario_id: str
    title: str
    description: str
    category: str # "BENIGN", "ADVERSARIAL", "SYSTEM"
    expected_outcome: str

class ScenarioRunRequest(BaseModel):
    scenario_id: str
    parameters: Dict[str, Any] = Field(default_factory=dict)

class ScenarioRunResponse(BaseModel):
    scenario_id: str
    workflow_id: str
    status: str
    overall_decision: str
    summary: str
    events_generated: List[AuditEvent]
    incidents_triggered: List[Incident]
    execution_time_ms: float

class CreateApprovalRequest(BaseModel):
    actor: str
    target_agent_id: str
    scope_resource: str
    operation: str
    destination: Optional[str] = None
    duration_minutes: int = 60
    metadata: Dict[str, Any] = Field(default_factory=dict)

class UpdateAgentStatusRequest(BaseModel):
    status: str = Field(..., description="ACTIVE, SUSPENDED, or REVOKED")
    reason: Optional[str] = Field(None, description="Reason for status change")

class UpdateIncidentStatusRequest(BaseModel):
    status: str = Field(..., description="OPEN, CONTAINED, RESOLVED, or DISMISSED")
    actor: Optional[str] = Field(None, description="Security analyst or system component updating status")
    notes: Optional[str] = Field(None, description="Investigation details or mitigation rationale")

class ToolExecutionRequest(BaseModel):
    source_agent_id: str
    tool_uri: str
    parameters: Dict[str, Any] = Field(default_factory=dict)

class VerifyApprovalRequest(BaseModel):
    approval_id_or_token: str
    target_agent_id: str
    operation: str
    scope_resource: str
    destination: Optional[str] = None

class VerifyApprovalResponse(BaseModel):
    valid: bool
    reason_code: str
    description: str
    approval_id: Optional[str] = None
    signature_verified: bool = False

class PolicyImportResponse(BaseModel):
    status: str
    imported_count: int
    total_rules: int
