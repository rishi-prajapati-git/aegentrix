import json
import yaml
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
    APPROVAL_SIGNATURE_INVALID = "APPROVAL_SIGNATURE_INVALID"
    APPROVAL_NOT_ACTIVE = "APPROVAL_NOT_ACTIVE"
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

class PolicyBundle(BaseModel):
    version: str = Field(default="1.0", description="Policy schema version")
    exported_at: Optional[str] = Field(default=None, description="ISO timestamp of export")
    author: Optional[str] = Field(default="system@aegentrix.local", description="Exporting entity or authority")
    description: Optional[str] = Field(default=None, description="Human-readable description of policy set")
    rules: List[PolicyRule] = Field(default_factory=list, description="Array of validated policy rules")

    def to_json(self, indent: int = 2) -> str:
        """Export policy bundle to formatted JSON string."""
        return self.model_dump_json(indent=indent)

    def to_yaml(self) -> str:
        """Export policy bundle to clean YAML string."""
        data = self.model_dump(mode="json")
        return yaml.safe_dump(data, sort_keys=False, default_flow_style=False)

    @classmethod
    def from_json(cls, json_str: str) -> "PolicyBundle":
        """Parse and validate policy bundle from JSON string."""
        data = json.loads(json_str)
        return cls.model_validate(data)

    @classmethod
    def from_yaml(cls, yaml_str: str) -> "PolicyBundle":
        """Parse and validate policy bundle from YAML string."""
        data = yaml.safe_load(yaml_str)
        return cls.model_validate(data)
