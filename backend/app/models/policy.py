from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DecisionType(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"

class ReasonCode(str, Enum):
    AUTHORIZED = "AUTHORIZED"
    AGENT_NOT_FOUND = "AGENT_NOT_FOUND"
    AGENT_SUSPENDED_OR_REVOKED = "AGENT_SUSPENDED_OR_REVOKED"
    UNAUTHORIZED_RESOURCE_ACCESS = "UNAUTHORIZED_RESOURCE_ACCESS"
    EXPLICITLY_DENIED_RESOURCE = "EXPLICITLY_DENIED_RESOURCE"
    UNAUTHORIZED_OPERATION = "UNAUTHORIZED_OPERATION"
    UNAUTHORIZED_DESTINATION_TRANSFER = "UNAUTHORIZED_DESTINATION_TRANSFER"
    APPROVAL_NOT_VERIFIED = "APPROVAL_NOT_VERIFIED"
    APPROVAL_EXPIRED = "APPROVAL_EXPIRED"
    APPROVAL_SCOPE_MISMATCH = "APPROVAL_SCOPE_MISMATCH"
    PROMPT_INJECTION_DETECTED = "PROMPT_INJECTION_DETECTED"
    TEMPORAL_THRESHOLD_EXCEEDED = "TEMPORAL_THRESHOLD_EXCEEDED"
    UNSAFE_TOOL_CALL = "UNSAFE_TOOL_CALL"
    DEFAULT_DENY = "DEFAULT_DENY"

class OperationType(str, Enum):
    READ = "READ"
    TRANSFER = "TRANSFER"
    TOOL_CALL = "TOOL_CALL"
    EXECUTE = "EXECUTE"

class PolicyRule(BaseModel):
    policy_id: str
    name: str
    description: str
    source_pattern: str = "*"
    operation: OperationType
    resource_pattern: str = "*"
    destination_pattern: Optional[str] = None
    required_trust_tier: Optional[str] = None
    requires_verifiable_approval: bool = False
    decision: DecisionType
    reason_code: ReasonCode

class PolicyEvaluationResult(BaseModel):
    decision: DecisionType
    reason_code: ReasonCode
    reason_description: str
    matched_policy_id: Optional[str] = None
    evaluated_at: str
    requires_escalation: bool = False
