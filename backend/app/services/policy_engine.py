from datetime import datetime, timezone
import fnmatch
from typing import Optional, Dict, Any, List
from ..models.policy import (
    PolicyEvaluationResult,
    DecisionType,
    ReasonCode,
    OperationType,
    PolicyRule
)
from .agent_registry import agent_registry
from .approval_manager import approval_manager

class PolicyEngine:
    def __init__(self):
        self._rules: List[PolicyRule] = []
        self._initialize_default_rules()

    def _initialize_default_rules(self):
        # Explicit baseline security rules
        self._rules = [
            PolicyRule(
                policy_id="POL-CORP-001",
                name="Research Agent Documentation Access",
                description="Allows Research Agent to read synthetic public and research documents",
                source_pattern="agent://research-*",
                operation=OperationType.READ,
                resource_pattern="res://research/*",
                decision=DecisionType.ALLOW,
                reason_code=ReasonCode.AUTHORIZED
            ),
            PolicyRule(
                policy_id="POL-CORP-002",
                name="Research Agent Inter-Agent Transfer",
                description="Allows Research Agent to transfer sanitized summaries to Communication Agent",
                source_pattern="agent://research-*",
                operation=OperationType.TRANSFER,
                resource_pattern="res://research/*",
                destination_pattern="agent://communication-*",
                decision=DecisionType.ALLOW,
                reason_code=ReasonCode.AUTHORIZED
            ),
            PolicyRule(
                policy_id="POL-CORP-003",
                name="Finance Agent Restricted Ledger Access",
                description="Allows Finance Agent to read corporate financial summaries",
                source_pattern="agent://finance-*",
                operation=OperationType.READ,
                resource_pattern="res://finance/*",
                decision=DecisionType.ALLOW,
                reason_code=ReasonCode.AUTHORIZED
            ),
            PolicyRule(
                policy_id="POL-CORP-004",
                name="Restricted Finance External Transfer Gating",
                description="Strictly gates any external transfer of financial data requiring verifiable administrative approval",
                source_pattern="*",
                operation=OperationType.TRANSFER,
                resource_pattern="res://finance/*",
                destination_pattern="ext://*",
                requires_verifiable_approval=True,
                decision=DecisionType.REQUIRE_APPROVAL,
                reason_code=ReasonCode.REQUIRE_APPROVAL if hasattr(ReasonCode, "REQUIRE_APPROVAL") else ReasonCode.APPROVAL_NOT_VERIFIED
            ),
            PolicyRule(
                policy_id="POL-CORP-005",
                name="Communication Agent Public Dispatches",
                description="Allows Communication Agent to dispatch approved public bulletins",
                source_pattern="agent://communication-*",
                operation=OperationType.TRANSFER,
                resource_pattern="res://public/*",
                destination_pattern="ext://*",
                decision=DecisionType.ALLOW,
                reason_code=ReasonCode.AUTHORIZED
            ),
            PolicyRule(
                policy_id="POL-CORP-006",
                name="Operations Sandbox Health Diagnostics",
                description="Allows Operations Agent to run allowlisted diagnostic health check",
                source_pattern="agent://operations-*",
                operation=OperationType.TOOL_CALL,
                resource_pattern="tool://sandbox_health_check",
                decision=DecisionType.ALLOW,
                reason_code=ReasonCode.AUTHORIZED
            )
        ]

    def list_policies(self) -> List[PolicyRule]:
        return self._rules

    def evaluate(
        self,
        source_agent_id: str,
        operation: str,
        target_resource: str,
        destination: Optional[str] = None,
        approval_id: Optional[str] = None,
        claims_verbal_approval: Optional[str] = None,
        advisory_model_flag: bool = False
    ) -> PolicyEvaluationResult:
        now_str = datetime.now(timezone.utc).isoformat()

        # 1. Verify agent existence & status
        agent = agent_registry.get_agent(source_agent_id)
        if not agent:
            return PolicyEvaluationResult(
                decision=DecisionType.DENY,
                reason_code=ReasonCode.AGENT_NOT_FOUND,
                reason_description=f"Agent '{source_agent_id}' is not registered in the system registry.",
                evaluated_at=now_str
            )

        if agent.status != "ACTIVE":
            return PolicyEvaluationResult(
                decision=DecisionType.DENY,
                reason_code=ReasonCode.AGENT_SUSPENDED_OR_REVOKED,
                reason_description=f"Agent '{source_agent_id}' is {agent.status}; access denied.",
                evaluated_at=now_str
            )

        # 2. Invariant Check: Verbal / Natural language claims of approval are strictly rejected
        if claims_verbal_approval and not approval_id:
            return PolicyEvaluationResult(
                decision=DecisionType.DENY,
                reason_code=ReasonCode.APPROVAL_NOT_VERIFIED,
                reason_description=f"Natural-language claim of approval ('{claims_verbal_approval}') is not a verifiable cryptographic approval record.",
                evaluated_at=now_str
            )

        # 3. If cryptographic approval provided, validate it
        has_valid_approval = False
        if approval_id:
            valid, reason = approval_manager.validate_approval(approval_id, source_agent_id, operation, target_resource, destination)
            if not valid:
                return PolicyEvaluationResult(
                    decision=DecisionType.DENY,
                    reason_code=ReasonCode(reason) if reason in ReasonCode.__members__ else ReasonCode.APPROVAL_NOT_VERIFIED,
                    reason_description=f"Supplied approval failed verification: {reason}",
                    evaluated_at=now_str
                )
            has_valid_approval = True

        # 4. Explicitly denied resources check (unless valid administrative approval exists)
        if not has_valid_approval:
            for denied_pattern in agent.explicitly_denied_resources:
                if fnmatch.fnmatch(target_resource, denied_pattern) or (destination and fnmatch.fnmatch(destination, denied_pattern)):
                    return PolicyEvaluationResult(
                        decision=DecisionType.DENY,
                        reason_code=ReasonCode.EXPLICITLY_DENIED_RESOURCE,
                        reason_description=f"Resource '{target_resource}' or destination '{destination}' is explicitly prohibited by policy for {agent.name}.",
                        evaluated_at=now_str
                    )

        # 4. Check capabilities
        # A. Check allowed operations
        # Normalize operation format
        op_str = operation.lower()
        has_op = any(fnmatch.fnmatch(op_str, f"*{allowed.lower()}*") or allowed.lower() in op_str for allowed in agent.capabilities.allowed_operations)
        # Also map generic READ / TRANSFER / TOOL_CALL
        if not has_op:
            if operation == "READ" and any("read" in a.lower() for a in agent.capabilities.allowed_operations):
                has_op = True
            elif operation == "TRANSFER" and any("transfer" in a.lower() or "send" in a.lower() or "draft" in a.lower() for a in agent.capabilities.allowed_operations):
                has_op = True
            elif operation == "TOOL_CALL" and agent.capabilities.allowed_tools:
                has_op = True

        if not has_op:
            return PolicyEvaluationResult(
                decision=DecisionType.DENY,
                reason_code=ReasonCode.UNAUTHORIZED_OPERATION,
                reason_description=f"Operation '{operation}' exceeds granted capabilities for {agent.name}.",
                evaluated_at=now_str
            )

        # B. Resource check
        has_res = any(fnmatch.fnmatch(target_resource, allowed_res) for allowed_res in agent.capabilities.allowed_resources)
        # If it's a tool call, check allowed tools
        if operation == "TOOL_CALL":
            has_res = any(fnmatch.fnmatch(target_resource, tool) for tool in agent.capabilities.allowed_tools)

        # If resource not permitted directly, check if a valid approval overrides it
        if not has_res and not has_valid_approval:
            return PolicyEvaluationResult(
                decision=DecisionType.DENY,
                reason_code=ReasonCode.UNAUTHORIZED_RESOURCE_ACCESS,
                reason_description=f"Agent '{agent.name}' is not authorized to access resource '{target_resource}'.",
                evaluated_at=now_str
            )

        # C. Destination check for transfers
        if operation == "TRANSFER" and destination and not has_valid_approval:
            has_dest = any(fnmatch.fnmatch(destination, allowed_dest) for allowed_dest in agent.capabilities.allowed_destinations)
            if not has_dest:
                return PolicyEvaluationResult(
                    decision=DecisionType.DENY,
                    reason_code=ReasonCode.UNAUTHORIZED_DESTINATION_TRANSFER,
                    reason_description=f"Agent '{agent.name}' is permitted to read '{target_resource}' but NOT authorized to transfer to '{destination}'.",
                    evaluated_at=now_str
                )

        # 5. Check if matching specific policy rules
        matched_rule = None
        for rule in self._rules:
            if fnmatch.fnmatch(source_agent_id, rule.source_pattern):
                if rule.operation.value == operation or rule.operation.name == operation:
                    if fnmatch.fnmatch(target_resource, rule.resource_pattern):
                        if not rule.destination_pattern or (destination and fnmatch.fnmatch(destination, rule.destination_pattern)):
                            matched_rule = rule
                            break

        if matched_rule and matched_rule.requires_verifiable_approval:
            if not approval_id:
                return PolicyEvaluationResult(
                    decision=DecisionType.REQUIRE_APPROVAL,
                    reason_code=ReasonCode.APPROVAL_NOT_VERIFIED,
                    reason_description=f"Operation matches policy '{matched_rule.policy_id}' requiring verifiable administrative approval.",
                    matched_policy_id=matched_rule.policy_id,
                    evaluated_at=now_str,
                    requires_escalation=True
                )
            else:
                valid, reason = approval_manager.validate_approval(approval_id, source_agent_id, operation, target_resource, destination)
                if not valid:
                    return PolicyEvaluationResult(
                        decision=DecisionType.DENY,
                        reason_code=ReasonCode(reason) if reason in ReasonCode.__members__ else ReasonCode.APPROVAL_NOT_VERIFIED,
                        reason_description=f"Supplied approval failed verification: {reason}",
                        matched_policy_id=matched_rule.policy_id,
                        evaluated_at=now_str
                    )

        # If everything verified, allow operation
        return PolicyEvaluationResult(
            decision=DecisionType.ALLOW,
            reason_code=ReasonCode.AUTHORIZED,
            reason_description=f"Operation '{operation}' on '{target_resource}' authorized by policy.",
            matched_policy_id=matched_rule.policy_id if matched_rule else "POL-DEFAULT-ALLOW-CAPABILITY",
            evaluated_at=now_str
        )

policy_engine = PolicyEngine()
