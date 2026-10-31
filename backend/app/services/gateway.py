from typing import Optional, Dict, Any
from ..models.policy import PolicyEvaluationResult, DecisionType
from ..models.audit import AuditEvent, ProvenanceInfo
from .policy_engine import policy_engine
from .model_adapter import model_adapter
from .audit_store import audit_store
from .temporal_analyzer import temporal_analyzer

class SecurityGateway:
    """
    Central Policy Enforcement Point (PEP) and Inter-Agent Communication Gateway.
    Mediates every protected read, data transfer, and tool invocation.
    """
    def execute_operation(
        self,
        workflow_id: str,
        correlation_id: str,
        source_agent_id: str,
        operation: str,
        target_resource: str,
        destination: Optional[str] = None,
        untrusted_content: Optional[str] = None,
        untrusted_origin: Optional[str] = None,
        claims_verbal_approval: Optional[str] = None,
        approval_id: Optional[str] = None,
        simulate_model_failure: bool = False,
        parameters: Optional[Dict[str, Any]] = None,
        raw_metadata: Optional[Dict[str, Any]] = None
    ) -> tuple[PolicyEvaluationResult, AuditEvent]:
        
        # 1. Advisory Model Analysis (if untrusted content present)
        advisory_analysis = None
        has_advisory_flag = False
        if untrusted_content:
            advisory_analysis = model_adapter.analyze_untrusted_content(
                content=untrusted_content,
                simulate_failure=simulate_model_failure
            )
            has_advisory_flag = bool(advisory_analysis.flags)

        # 2. Authoritative Deterministic Policy Evaluation (including dynamic suspension & parameter validation)
        eval_result = policy_engine.evaluate(
            source_agent_id=source_agent_id,
            operation=operation,
            target_resource=target_resource,
            destination=destination,
            approval_id=approval_id,
            claims_verbal_approval=claims_verbal_approval,
            advisory_model_flag=has_advisory_flag,
            parameters=parameters
        )

        # 3. Provenance tracking
        provenance = ProvenanceInfo(
            caller_chain=[source_agent_id],
            untrusted_input_origin=untrusted_origin,
            claims_approval_by=claims_verbal_approval
        )

        meta = dict(raw_metadata or {})
        if parameters:
            meta["tool_parameters"] = parameters

        # 4. Record Structured Audit Event (secrets redacted)
        audit_event = audit_store.record_event(
            workflow_id=workflow_id,
            correlation_id=correlation_id,
            source_agent_id=source_agent_id,
            operation=operation,
            target_resource_or_recipient=destination or target_resource,
            decision=eval_result.decision.value,
            reason_code=eval_result.reason_code.value,
            reason_description=eval_result.reason_description,
            matched_policy_id=eval_result.matched_policy_id,
            provenance=provenance,
            advisory_model_analysis=advisory_analysis,
            raw_metadata=meta
        )

        # 5. Check Temporal Risk Correlation
        temporal_analyzer.analyze_event_sequence(workflow_id)

        return eval_result, audit_event

gateway = SecurityGateway()
