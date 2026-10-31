from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, List
import uuid
from ..models.approval import ApprovalRecord
from ..core.security import sign_approval, verify_approval_signature

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
        metadata: Optional[Dict] = None,
        secret_key: Optional[str] = None
    ) -> ApprovalRecord:
        """
        Creates a time-bounded, scope-restricted approval record with a cryptographic HMAC signature.
        """
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=duration_minutes)
        approval_id = f"appr_{uuid.uuid4().hex[:12]}"
        created_at_str = now.isoformat()
        expires_at_str = expires_at.isoformat()

        # Compute cryptographic HMAC-SHA256 signature
        signature = sign_approval(
            approval_id=approval_id,
            actor=actor,
            target_agent_id=target_agent_id,
            scope_resource=scope_resource,
            operation=operation,
            destination=destination,
            created_at=created_at_str,
            expires_at=expires_at_str,
            secret_key=secret_key
        )
        token = f"{approval_id}.{signature}"

        record = ApprovalRecord(
            approval_id=approval_id,
            actor=actor,
            target_agent_id=target_agent_id,
            scope_resource=scope_resource,
            operation=operation,
            destination=destination,
            created_at=created_at_str,
            expires_at=expires_at_str,
            status="ACTIVE",
            metadata=metadata or {},
            signature=signature,
            token=token,
            algorithm="HMAC-SHA256"
        )
        self._approvals[approval_id] = record
        return record

    def get_approval(self, approval_id: str) -> Optional[ApprovalRecord]:
        return self._approvals.get(approval_id)

    def revoke_approval(self, approval_id: str) -> bool:
        """Revokes an existing active approval token."""
        record = self._approvals.get(approval_id)
        if record:
            record.status = "REVOKED"
            return True
        return False

    def verify_token_integrity(self, token_or_id: str) -> tuple[bool, Optional[ApprovalRecord], str]:
        """Validates cryptographic integrity of a token or approval record without scope checking."""
        if not token_or_id:
            return False, None, "APPROVAL_NOT_VERIFIED"
        
        parts = token_or_id.split(".", 1)
        approval_id = parts[0]
        provided_sig = parts[1] if len(parts) > 1 else None

        record = self._approvals.get(approval_id)
        if not record:
            return False, None, "APPROVAL_NOT_VERIFIED"

        # Check signature matches canonical payload
        is_valid = verify_approval_signature(
            approval_id=record.approval_id,
            actor=record.actor,
            target_agent_id=record.target_agent_id,
            scope_resource=record.scope_resource,
            operation=record.operation,
            destination=record.destination,
            created_at=record.created_at,
            expires_at=record.expires_at,
            signature=record.signature or ""
        )
        if not is_valid:
            return False, record, "APPROVAL_SIGNATURE_INVALID"

        if provided_sig and provided_sig != record.signature:
            return False, record, "APPROVAL_SIGNATURE_INVALID"

        return True, record, "VALID"

    def validate_approval(
        self,
        approval_id_or_token: str,
        agent_id: str,
        operation: str,
        resource: str,
        destination: Optional[str] = None
    ) -> tuple[bool, str]:
        """
        Verifies cryptographic signature, active state, expiration, and exact scope.
        """
        if not approval_id_or_token:
            return False, "APPROVAL_NOT_VERIFIED"

        parts = approval_id_or_token.split(".", 1)
        approval_id = parts[0]
        provided_sig = parts[1] if len(parts) > 1 else None

        record = self._approvals.get(approval_id)
        if not record:
            return False, "APPROVAL_NOT_VERIFIED"

        # 1. Cryptographic HMAC Signature Verification
        is_sig_valid = verify_approval_signature(
            approval_id=record.approval_id,
            actor=record.actor,
            target_agent_id=record.target_agent_id,
            scope_resource=record.scope_resource,
            operation=record.operation,
            destination=record.destination,
            created_at=record.created_at,
            expires_at=record.expires_at,
            signature=record.signature or ""
        )
        if not is_sig_valid:
            return False, "APPROVAL_SIGNATURE_INVALID"

        if provided_sig and provided_sig != record.signature:
            return False, "APPROVAL_SIGNATURE_INVALID"

        # 2. Check Active Status
        if record.status != "ACTIVE":
            return False, "APPROVAL_NOT_ACTIVE"

        # 3. Check Expiry
        now = datetime.now(timezone.utc)
        try:
            expiry_dt = datetime.fromisoformat(record.expires_at)
            if now > expiry_dt:
                record.status = "EXPIRED"
                return False, "APPROVAL_EXPIRED"
        except Exception:
            return False, "APPROVAL_EXPIRED"

        # 4. Check Target Agent
        if record.target_agent_id != agent_id and record.target_agent_id != "*":
            return False, "APPROVAL_SCOPE_MISMATCH"

        # 5. Check Operation
        if record.operation != operation and record.operation != "*":
            return False, "APPROVAL_SCOPE_MISMATCH"

        # 6. Check Resource Match (exact or wildcard prefix)
        if record.scope_resource != resource and not resource.startswith(record.scope_resource.rstrip("*")):
            return False, "APPROVAL_SCOPE_MISMATCH"

        # 7. Check Destination Match (if applicable)
        if destination and record.destination and record.destination != destination and record.destination != "*":
            return False, "APPROVAL_SCOPE_MISMATCH"

        return True, "AUTHORIZED"

    def list_approvals(self) -> List[ApprovalRecord]:
        return list(self._approvals.values())

    def clear(self):
        """Reset approval store (primarily for unit test isolation)."""
        self._approvals.clear()

approval_manager = ApprovalManager()
