from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, List
import uuid
from ..models.approval import ApprovalRecord

class ApprovalManager:
    def __init__(self):
        self._approvals: Dict[str, ApprovalRecord] = {}

    def create_approval(
        self,
        actor: str,
        target_agent_id: str,
        scope_resource: str,
        operation: str,
        destination: Optional[str] = None,
        duration_minutes: int = 60,
        metadata: Optional[Dict] = None
    ) -> ApprovalRecord:
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=duration_minutes)
        approval_id = f"appr_{uuid.uuid4().hex[:12]}"
        
        record = ApprovalRecord(
            approval_id=approval_id,
            actor=actor,
            target_agent_id=target_agent_id,
            scope_resource=scope_resource,
            operation=operation,
            destination=destination,
            created_at=now.isoformat(),
            expires_at=expires_at.isoformat(),
            status="ACTIVE",
            metadata=metadata or {}
        )
        self._approvals[approval_id] = record
        return record

    def get_approval(self, approval_id: str) -> Optional[ApprovalRecord]:
        return self._approvals.get(approval_id)

    def validate_approval(
        self,
        approval_id: str,
        agent_id: str,
        operation: str,
        resource: str,
        destination: Optional[str] = None
    ) -> tuple[bool, str]:
        """Verifies if an approval record is valid, non-expired, and matches target scope."""
        record = self._approvals.get(approval_id)
        if not record:
            return False, "APPROVAL_NOT_VERIFIED"
        
        if record.status != "ACTIVE":
            return False, "APPROVAL_NOT_ACTIVE"

        now = datetime.now(timezone.utc)
        expiry_dt = datetime.fromisoformat(record.expires_at)
        if now > expiry_dt:
            record.status = "EXPIRED"
            return False, "APPROVAL_EXPIRED"

        if record.target_agent_id != agent_id and record.target_agent_id != "*":
            return False, "APPROVAL_SCOPE_MISMATCH"

        if record.operation != operation and record.operation != "*":
            return False, "APPROVAL_SCOPE_MISMATCH"

        # Check resource match
        if record.scope_resource != resource and not resource.startswith(record.scope_resource.rstrip("*")):
            return False, "APPROVAL_SCOPE_MISMATCH"

        if destination and record.destination and record.destination != destination and record.destination != "*":
            return False, "APPROVAL_SCOPE_MISMATCH"

        return True, "AUTHORIZED"

    def list_approvals(self) -> List[ApprovalRecord]:
        return list(self._approvals.values())

approval_manager = ApprovalManager()
