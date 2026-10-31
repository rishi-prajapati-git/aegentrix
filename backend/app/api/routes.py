from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Optional, Dict, Any
import uuid

from ..models.agent import AgentModel
from ..models.policy import PolicyRule, PolicyBundle
from ..models.requests import (
    ScenarioInfo,
    ScenarioRunResponse,
    CreateApprovalRequest,
    UpdateAgentStatusRequest,
    UpdateIncidentStatusRequest,
    ToolExecutionRequest,
    VerifyApprovalRequest,
    VerifyApprovalResponse,
    PolicyImportResponse
)
from ..models.approval import ApprovalRecord
from ..models.audit import AuditEvent, Incident, PaginatedAuditEventsResponse

from ..services.agent_registry import agent_registry
from ..services.policy_engine import policy_engine
from ..services.scenario_runner import scenario_runner
from ..services.approval_manager import approval_manager
from ..services.audit_store import audit_store
from ..services.gateway import gateway
from ..core.config import settings

api_router = APIRouter()

@api_router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "environment": settings.environment,
        "advisory_model_status": "enabled" if settings.ai_analysis_enabled else "fallback_mode",
        "advisory_provider": settings.ai_model_provider or "deterministic_heuristic"
    }

@api_router.get("/api/agents", response_model=List[AgentModel])
def get_agents():
    return agent_registry.list_agents()

@api_router.patch("/api/agents/{agent_id:path}/status", response_model=AgentModel)
def update_agent_status(agent_id: str, req: UpdateAgentStatusRequest):
    success = agent_registry.update_agent_status(agent_id, req.status, req.reason)
    if not success:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found.")
    return agent_registry.get_agent(agent_id)

@api_router.get("/api/policies", response_model=List[PolicyRule])
def get_policies():
    return policy_engine.list_policies()

@api_router.get("/api/policies/export")
def export_policies(format: str = Query("json", pattern="^(json|yaml)$")):
    """
    Exports currently active policy bundle formatted in JSON or YAML.
    """
    if format.lower() == "yaml":
        yaml_content = policy_engine.export_to_yaml()
        return Response(content=yaml_content, media_type="application/x-yaml")
    return policy_engine.export_bundle()

@api_router.post("/api/policies/import", response_model=PolicyImportResponse)
def import_policies(bundle: PolicyBundle, overwrite: bool = Query(False)):
    """
    Imports a verified PolicyBundle containing structured PolicyRules.
    If overwrite is True, replaces all existing active rules.
    """
    imported = policy_engine.import_bundle(bundle, overwrite=overwrite)
    return PolicyImportResponse(
        status="success",
        imported_count=imported,
        total_rules=len(policy_engine.list_policies())
    )

@api_router.get("/api/scenarios", response_model=List[ScenarioInfo])
def get_scenarios():
    return scenario_runner.list_scenarios()

@api_router.post("/api/scenarios/{scenario_id}/run", response_model=ScenarioRunResponse)
def run_scenario(scenario_id: str, payload: Optional[Dict[str, Any]] = None):
    try:
        return scenario_runner.run_scenario(scenario_id, payload or {})
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario execution failed: {str(e)}")

@api_router.post("/api/tools/execute")
def execute_tool(req: ToolExecutionRequest):
    wf_id = f"wf_tool_{uuid.uuid4().hex[:8]}"
    corr_id = f"corr_tool_{uuid.uuid4().hex[:8]}"
    res, event = gateway.execute_operation(
        workflow_id=wf_id,
        correlation_id=corr_id,
        source_agent_id=req.source_agent_id,
        operation="TOOL_CALL",
        target_resource=req.tool_uri,
        parameters=req.parameters
    )
    return {
        "decision": res.decision.value,
        "reason_code": res.reason_code.value,
        "reason_description": res.reason_description,
        "event_id": event.event_id
    }

@api_router.get("/api/events", response_model=List[AuditEvent])
def get_events(
    response: Response,
    workflow_id: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[str] = Query(None, description="Opaque pagination cursor token"),
    direction: str = Query("next", pattern="^(next|prev)$")
):
    """
    Retrieves audit events in reverse-chronological order.
    Supports cursor-based pagination with pagination metadata populated in response headers.
    """
    page, next_cur, prev_cur, has_more, total_count = audit_store.get_events_paginated(
        workflow_id=workflow_id,
        agent_id=agent_id,
        decision=decision,
        limit=limit,
        cursor=cursor,
        direction=direction
    )
    if next_cur:
        response.headers["X-Next-Cursor"] = next_cur
    if prev_cur:
        response.headers["X-Prev-Cursor"] = prev_cur
    response.headers["X-Has-More"] = str(has_more).lower()
    response.headers["X-Total-Count"] = str(total_count)
    return page


@api_router.get("/api/events/export")
def export_events(format: str = Query("json", pattern="^(json|csv)$")):
    """Exports full audit history as structured JSON or CSV (Task 6.2)."""
    if format == "csv":
        csv_data = audit_store.export_events_csv()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=aegentrix_audit_events.csv"}
        )
    else:
        json_data = audit_store.export_events_json()
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=aegentrix_audit_events.json"}
        )

@api_router.get("/api/events/paginated", response_model=PaginatedAuditEventsResponse)
def get_events_paginated(
    workflow_id: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[str] = Query(None, description="Opaque cursor token from previous request"),
    direction: str = Query("next", pattern="^(next|prev)$")
):
    """
    Cursor-based paginated endpoint returning full structured page envelope for large audit log volumes.
    """
    page, next_cur, prev_cur, has_more, total_count = audit_store.get_events_paginated(
        workflow_id=workflow_id,
        agent_id=agent_id,
        decision=decision,
        limit=limit,
        cursor=cursor,
        direction=direction
    )
    return PaginatedAuditEventsResponse(
        events=page,
        next_cursor=next_cur,
        prev_cursor=prev_cur,
        has_more=has_more,
        total_count=total_count,
        limit=limit
    )

@api_router.get("/api/incidents", response_model=List[Incident])
def get_incidents(limit: int = Query(20, le=100)):
    return audit_store.get_incidents(limit=limit)

@api_router.get("/api/incidents/{incident_id}", response_model=Incident)
def get_incident(incident_id: str):
    inc = audit_store.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return inc

@api_router.patch("/api/incidents/{incident_id}/status", response_model=Incident)
def update_incident_status(incident_id: str, req: UpdateIncidentStatusRequest):
    try:
        updated = audit_store.update_incident_status(
            incident_id=incident_id,
            status=req.status,
            actor=req.actor,
            notes=req.notes
        )
        if not updated:
            raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/api/metrics")
def get_metrics():
    return audit_store.get_metrics()

@api_router.post("/api/approvals", response_model=ApprovalRecord)
def create_approval(req: CreateApprovalRequest):
    return approval_manager.create_approval(
        actor=req.actor,
        target_agent_id=req.target_agent_id,
        scope_resource=req.scope_resource,
        operation=req.operation,
        destination=req.destination,
        duration_minutes=req.duration_minutes,
        metadata=req.metadata
    )

@api_router.get("/api/approvals", response_model=List[ApprovalRecord])
def list_approvals():
    return approval_manager.list_approvals()

@api_router.post("/api/approvals/verify", response_model=VerifyApprovalResponse)
def verify_approval(req: VerifyApprovalRequest):
    """
    Verifies cryptographic signature integrity, status, expiration, and scope of an approval token.
    """
    valid, reason = approval_manager.validate_approval(
        approval_id_or_token=req.approval_id_or_token,
        agent_id=req.target_agent_id,
        operation=req.operation,
        resource=req.scope_resource,
        destination=req.destination
    )
    sig_valid, record, _ = approval_manager.verify_token_integrity(req.approval_id_or_token)
    return VerifyApprovalResponse(
        valid=valid,
        reason_code=reason,
        description=f"Approval validation result: {reason}",
        approval_id=record.approval_id if record else None,
        signature_verified=sig_valid
    )

@api_router.post("/api/approvals/{approval_id}/revoke")
def revoke_approval(approval_id: str):
    """
    Revokes an active approval record.
    """
    success = approval_manager.revoke_approval(approval_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Approval '{approval_id}' not found.")
    return {"status": "revoked", "approval_id": approval_id}
