from typing import Dict, List, Optional
from datetime import datetime, timezone
from ..models.agent import AgentModel, AgentCapability

class AgentRegistry:
    def __init__(self):
        self._agents: Dict[str, AgentModel] = {}
        self._initialize_default_agents()

    def _initialize_default_agents(self):
        defaults = [
            AgentModel(
                agent_id="agent://research-01",
                name="Research Agent",
                role="Scientific and Market Intelligence Analyst",
                trust_tier="STANDARD",
                capabilities=AgentCapability(
                    allowed_operations=["read_research_docs", "analyze_public_content", "draft_research_summary"],
                    allowed_resources=["res://research/*", "res://public/*"],
                    allowed_destinations=["agent://communication-01", "internal://scratchpad"],
                    allowed_tools=["tool://document_parser", "tool://web_scraper"]
                ),
                explicitly_denied_resources=["res://finance/*", "res://credentials/*", "res://admin/*"],
                status="ACTIVE"
            ),
            AgentModel(
                agent_id="agent://finance-01",
                name="Finance Agent",
                role="Corporate Financial & Ledger Records Specialist",
                trust_tier="PRIVILEGED",
                capabilities=AgentCapability(
                    allowed_operations=["read_finance_data", "calculate_aggregates", "approve_financial_summary"],
                    allowed_resources=["res://finance/*", "res://public/*"],
                    allowed_destinations=["agent://auditor-01"],
                    allowed_tools=["tool://ledger_query", "tool://metric_calculator"]
                ),
                explicitly_denied_resources=["ext://*", "res://credentials/*"],
                status="ACTIVE"
            ),
            AgentModel(
                agent_id="agent://communication-01",
                name="Communication Agent",
                role="Outbound Public Dispatcher and PR Liaison",
                trust_tier="STANDARD",
                capabilities=AgentCapability(
                    allowed_operations=["draft_external_message", "send_public_release"],
                    allowed_resources=["res://public/*", "res://drafts/*"],
                    allowed_destinations=["ext://customer_channel", "ext://public_bulletin"],
                    allowed_tools=["tool://email_dispatcher", "tool://slack_notifier"]
                ),
                explicitly_denied_resources=["res://finance/*", "res://credentials/*", "res://admin/*"],
                status="ACTIVE"
            ),
            AgentModel(
                agent_id="agent://operations-01",
                name="Operations Agent",
                role="Infrastructure Orchestration & Health Maintenance",
                trust_tier="PRIVILEGED",
                capabilities=AgentCapability(
                    allowed_operations=["run_diagnostics", "restart_worker_sandbox"],
                    allowed_resources=["res://telemetry/*", "res://config/workers"],
                    allowed_destinations=["agent://research-01", "agent://finance-01"],
                    allowed_tools=["tool://sandbox_health_check", "tool://worker_reboot"]
                ),
                explicitly_denied_resources=["res://finance/*", "res://credentials/*"],
                status="ACTIVE"
            )
        ]
        for agent in defaults:
            self._agents[agent.agent_id] = agent

    def get_agent(self, agent_id: str) -> Optional[AgentModel]:
        return self._agents.get(agent_id)

    def list_agents(self) -> List[AgentModel]:
        return list(self._agents.values())

    def update_agent_status(self, agent_id: str, status: str, reason: Optional[str] = None) -> bool:
        if agent_id in self._agents:
            agent = self._agents[agent_id]
            agent.status = status.upper()
            agent.revocation_reason = reason
            agent.status_updated_at = datetime.now(timezone.utc).isoformat()
            return True
        return False

    def suspend_agent(self, agent_id: str, reason: str = "Suspended mid-workflow") -> bool:
        return self.update_agent_status(agent_id, "SUSPENDED", reason)

    def revoke_agent(self, agent_id: str, reason: str = "Security revocation") -> bool:
        return self.update_agent_status(agent_id, "REVOKED", reason)

    def reactivate_agent(self, agent_id: str) -> bool:
        return self.update_agent_status(agent_id, "ACTIVE", None)

    def reset(self):
        """Reset all agents back to default status and configurations."""
        self._agents.clear()
        self._initialize_default_agents()

agent_registry = AgentRegistry()
