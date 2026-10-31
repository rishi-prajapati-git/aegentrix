from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class ApprovalRecord(BaseModel):
    approval_id: str = Field(..., description="Unique server-generated verifiable approval ID")
    actor: str = Field(..., description="Administrator or authorized authority issuing approval")
    target_agent_id: str = Field(..., description="Agent authorized by this approval")
    scope_resource: str = Field(..., description="Target resource pattern e.g. res://finance/q3_summary")
    operation: str = Field(..., description="Specific authorized operation e.g. READ or TRANSFER")
    destination: Optional[str] = Field(None, description="Permitted transfer destination if applicable")
    created_at: str
    expires_at: str
    status: str = Field(default="ACTIVE", description="ACTIVE, USED, REVOKED, EXPIRED")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Cryptographic HMAC Digital Signature Fields
    signature: Optional[str] = Field(None, description="Cryptographic HMAC-SHA256 signature guaranteeing approval integrity")
    token: Optional[str] = Field(None, description="Verifiable approval token formatted as '<approval_id>.<signature>'")
    algorithm: str = Field(default="HMAC-SHA256", description="Cryptographic signature algorithm")
