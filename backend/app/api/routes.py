from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any

from ..models.agent import AgentModel
from ..models.policy import PolicyRule
from ..models.requests import ScenarioInfo, ScenarioRunResponse, CreateApprovalRequest
from ..models.approval import ApprovalRecord
from ..models.audit import AuditEvent, Incident

from ..services.agent_registry import agent_registry
from ..services.policy_engine import policy_engine
from ..services.scenario_runner import scenario_runner
from ..services.approval_manager import approval_manager
from ..services.audit_store import audit_store
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

@api_router.get("/api/policies", response_model=List[PolicyRule])
def get_policies():
    return policy_engine.list_policies()

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

@api_router.get("/api/events", response_model=List[AuditEvent])
def get_events(
    workflow_id: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    limit: int = Query(50, le=200)
):
    return audit_store.get_events(workflow_id=workflow_id, agent_id=agent_id, decision=decision, limit=limit)

@api_router.get("/api/incidents", response_model=List[Incident])
def get_incidents(limit: int = Query(20, le=100)):
    return audit_store.get_incidents(limit=limit)

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
