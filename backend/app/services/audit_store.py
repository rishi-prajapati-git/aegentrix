from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
import uuid
from ..models.audit import AuditEvent, Incident
from ..core.security import sanitize_payload

class AuditStore:
    def __init__(self):
        self._events: List[AuditEvent] = []
        self._incidents: List[Incident] = []

    def record_event(
        self,
        workflow_id: str,
        correlation_id: str,
        source_agent_id: str,
        operation: str,
        target_resource_or_recipient: str,
        decision: str,
        reason_code: str,
        reason_description: str,
        matched_policy_id: Optional[str] = None,
        payload_size_bytes: int = 0,
        provenance: Optional[Any] = None,
        advisory_model_analysis: Optional[Any] = None,
        raw_metadata: Optional[Dict[str, Any]] = None
    ) -> AuditEvent:
        event_id = f"evt_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now(timezone.utc).isoformat()
        sanitized_meta = sanitize_payload(raw_metadata or {})

        size_bytes = payload_size_bytes
        if size_bytes == 0 and raw_metadata:
            size_bytes = int(raw_metadata.get("payload_size_bytes") or raw_metadata.get("bytes_transferred") or raw_metadata.get("size_bytes") or 0)

        event = AuditEvent(
            event_id=event_id,
            timestamp=now_str,
            workflow_id=workflow_id,
            correlation_id=correlation_id,
            source_agent_id=source_agent_id,
            operation=operation,
            target_resource_or_recipient=target_resource_or_recipient,
            payload_classification="CONFIDENTIAL",
            payload_size_bytes=size_bytes,
            decision=decision,
            reason_code=reason_code,
            reason_description=reason_description,
            matched_policy_id=matched_policy_id,
            provenance=provenance if provenance else getattr(provenance, '__dict__', {}),
            advisory_model_analysis=advisory_model_analysis,
            sanitized_metadata=sanitized_meta
        )
        self._events.append(event)
        return event

    def record_incident(
        self,
        rule_name: str,
        description: str,
        workflow_id: str,
        correlated_event_ids: List[str],
        affected_agents: List[str],
        severity: str = "HIGH"
    ) -> Incident:
        incident_id = f"inc_{uuid.uuid4().hex[:10]}"
        now_str = datetime.now(timezone.utc).isoformat()

        incident = Incident(
            incident_id=incident_id,
            timestamp=now_str,
            severity=severity,
            rule_name=rule_name,
            description=description,
            workflow_id=workflow_id,
            correlated_event_ids=correlated_event_ids,
            affected_agents=affected_agents,
            status="OPEN"
        )
        self._incidents.append(incident)
        return incident

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        for inc in self._incidents:
            if inc.incident_id == incident_id:
                return inc
        return None

    def update_incident_status(
        self,
        incident_id: str,
        status: str,
        actor: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Optional[Incident]:
        valid_statuses = {"OPEN", "CONTAINED", "RESOLVED", "DISMISSED"}
        status_clean = status.upper().strip()
        if status_clean not in valid_statuses:
            raise ValueError(f"Invalid incident status '{status}'. Must be one of {valid_statuses}")

        for inc in self._incidents:
            if inc.incident_id == incident_id:
                inc.status = status_clean
                inc.updated_at = datetime.now(timezone.utc).isoformat()
                if actor:
                    inc.resolved_by = actor
                if notes:
                    inc.resolution_notes = notes
                return inc
        return None

    def get_events(
        self,
        workflow_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        decision: Optional[str] = None,
        limit: int = 50
    ) -> List[AuditEvent]:
        filtered = self._events
        if workflow_id:
            filtered = [e for e in filtered if e.workflow_id == workflow_id]
        if agent_id:
            filtered = [e for e in filtered if e.source_agent_id == agent_id]
        if decision:
            filtered = [e for e in filtered if e.decision == decision]
        return list(reversed(filtered[-limit:]))

    def get_incidents(self, limit: int = 20) -> List[Incident]:
        return list(reversed(self._incidents[-limit:]))

    def get_metrics(self) -> Dict[str, Any]:
        total = len(self._events)
        allowed = sum(1 for e in self._events if e.decision == "ALLOW")
        denied = sum(1 for e in self._events if e.decision == "DENY")
        escalated = sum(1 for e in self._events if e.decision == "REQUIRE_APPROVAL")
        flagged = sum(1 for e in self._events if e.advisory_model_analysis and e.advisory_model_analysis.flags)
        open_incidents = sum(1 for inc in self._incidents if inc.status == "OPEN")

        return {
            "total_events": total,
            "allowed_count": allowed,
            "denied_count": denied,
            "escalated_count": escalated,
            "flagged_signals_count": flagged,
            "open_incidents_count": open_incidents
        }

    def clear(self):
        """Clears memory for testing purposes."""
        self._events.clear()
        self._incidents.clear()

audit_store = AuditStore()
