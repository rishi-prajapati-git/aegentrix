from typing import List, Optional
from pydantic import BaseModel, Field

class AgentCapability(BaseModel):
    allowed_operations: List[str] = Field(
        default_factory=list, 
        description="Allowed operations e.g. ['read_research_docs', 'send_external_summary']"
    )
    allowed_resources: List[str] = Field(
        default_factory=list, 
        description="Resources agent is authorized to access e.g. ['res://research/*', 'res://public/*']"
    )
    allowed_destinations: List[str] = Field(
        default_factory=list,
        description="Destinations permitted for data transfer e.g. ['agent://communication', 'ext://public_feed']"
    )
    allowed_tools: List[str] = Field(
        default_factory=list,
        description="Explicitly allowlisted tools"
    )

class AgentModel(BaseModel):
    agent_id: str = Field(..., description="Unique agent identifier (e.g. agent://research-01)")
    name: str = Field(..., description="Human-friendly agent display name")
    role: str = Field(..., description="Role description (e.g. Research Specialist)")
    trust_tier: str = Field(default="STANDARD", description="Trust level: UNTRUSTED, STANDARD, PRIVILEGED")
    capabilities: AgentCapability = Field(default_factory=AgentCapability)
    explicitly_denied_resources: List[str] = Field(default_factory=list)
    status: str = Field(default="ACTIVE", description="ACTIVE, SUSPENDED, REVOKED")
    revocation_reason: Optional[str] = Field(default=None, description="Reason if suspended or revoked")
    status_updated_at: Optional[str] = Field(default=None, description="ISO timestamp of status update")
