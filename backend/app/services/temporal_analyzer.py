from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from ..models.audit import AuditEvent, Incident
from .audit_store import audit_store
from ..core.config import settings

class TemporalRiskAnalyzer:
    """
    Correlates security events across time, sliding windows, and agent interactions
    to detect progressive, multi-step, distributed, and cumulative attack patterns.
    """
    def __init__(self):
        self.window_seconds: int = settings.temporal_window_seconds
        self.denial_threshold: int = settings.max_consecutive_denials_threshold
        self.data_read_threshold_bytes: int = settings.data_read_threshold_bytes

    def _parse_event_time(self, ts_str: str) -> datetime:
        try:
            dt = datetime.fromisoformat(ts_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return datetime.now(timezone.utc)

    def get_window_events(
        self,
        workflow_id: Optional[str] = None,
        reference_time: Optional[datetime] = None
    ) -> List[AuditEvent]:
        """
        Retrieves events occurring within the active sliding time window.
        Events timestamped outside the sliding window are filtered out.
        """
        now = reference_time or datetime.now(timezone.utc)
        cutoff = now - timedelta(seconds=self.window_seconds)

        active_events = []
        for e in audit_store._events:
            if workflow_id and e.workflow_id != workflow_id:
                continue
            ev_time = self._parse_event_time(e.timestamp)
            if ev_time >= cutoff:
                active_events.append(e)

        return active_events

    def cleanup_expired_state(self, reference_time: Optional[datetime] = None) -> int:
        """
        Cleans up expired events from the primary audit store buffer that fall outside
        extended retention while preserving recorded incidents.
        Returns the count of purged events.
        """
        now = reference_time or datetime.now(timezone.utc)
        # Keep 5x window for audit queries, drop older ephemeral correlation logs if > 1000 items
        cutoff = now - timedelta(seconds=self.window_seconds * 5)
        before_count = len(audit_store._events)
        if before_count > 500:
            audit_store._events = [
                e for e in audit_store._events 
                if self._parse_event_time(e.timestamp) >= cutoff
            ]
        return before_count - len(audit_store._events)

    def analyze_event_sequence(
        self,
        workflow_id: str,
        reference_time: Optional[datetime] = None
    ) -> List[Incident]:
        """
        Evaluates events associated with a workflow within the sliding time window
        to detect complex coordinated attack sequences and cumulative volume spikes.
        """
        events = self.get_window_events(workflow_id=workflow_id, reference_time=reference_time)
        if not events:
            return []

        new_incidents: List[Incident] = []

        # -------------------------------------------------------------
        # Rule 1: Multi-Step Injection to Exfiltration Chain
        # Sequence: Flagged prompt injection -> Restricted Read Attempt -> Outbound Transfer Attempt
        # -------------------------------------------------------------
        has_injection_flag = any(
            (e.advisory_model_analysis and any("INSTRUCTION_OVERRIDE" in f or "EXFILTRATION" in f for f in e.advisory_model_analysis.flags))
            or (e.provenance and e.provenance.untrusted_input_origin)
            for e in events
        )
        has_restricted_read_denial = any(
            e.operation == "READ" and "finance" in e.target_resource_or_recipient and e.decision == "DENY"
            for e in events
        )
        has_outbound_transfer_attempt = any(
            e.operation == "TRANSFER" and ("ext://" in e.target_resource_or_recipient or "communication" in e.target_resource_or_recipient)
            for e in events
        )

        if has_injection_flag and (has_restricted_read_denial or has_outbound_transfer_attempt):
            existing = [
                inc for inc in audit_store._incidents 
                if inc.workflow_id == workflow_id and inc.rule_name == "RULE_MULTI_STEP_EXFILTRATION_CHAIN"
            ]
            if not existing:
                correlated_ids = [e.event_id for e in events]
                affected_agents = list({e.source_agent_id for e in events})
                inc = audit_store.record_incident(
                    rule_name="RULE_MULTI_STEP_EXFILTRATION_CHAIN",
                    description="Coordinated multi-step attack chain detected: prompt injection origin followed by unauthorized restricted access and exfiltration routing attempt.",
                    workflow_id=workflow_id,
                    correlated_event_ids=correlated_ids,
                    affected_agents=affected_agents,
                    severity="CRITICAL"
                )
                new_incidents.append(inc)

        # -------------------------------------------------------------
        # Rule 2: Repeated Denied Access Brute Force / Probing
        # -------------------------------------------------------------
        denied_events = [e for e in events if e.decision == "DENY"]
        if len(denied_events) >= self.denial_threshold:
            existing = [
                inc for inc in audit_store._incidents 
                if inc.workflow_id == workflow_id and inc.rule_name == "RULE_REPEATED_ACCESS_PROBING"
            ]
            if not existing:
                correlated_ids = [e.event_id for e in denied_events]
                affected_agents = list({e.source_agent_id for e in denied_events})
                inc = audit_store.record_incident(
                    rule_name="RULE_REPEATED_ACCESS_PROBING",
                    description=f"Threshold breach: detected {len(denied_events)} consecutive denied security operations within sliding time window ({self.window_seconds}s).",
                    workflow_id=workflow_id,
                    correlated_event_ids=correlated_ids,
                    affected_agents=affected_agents,
                    severity="HIGH"
                )
                new_incidents.append(inc)

        # -------------------------------------------------------------
        # Rule 3: Cumulative Byte-Size Data Exfiltration Threshold
        # Detects distributed small reads/transfers adding up to exfiltration volume
        # -------------------------------------------------------------
        volume_events = [
            e for e in events 
            if e.operation in ["READ", "TRANSFER"] and (e.payload_size_bytes or 0) > 0
        ]
        total_bytes = sum(e.payload_size_bytes for e in volume_events)
        if total_bytes >= self.data_read_threshold_bytes:
            existing = [
                inc for inc in audit_store._incidents 
                if inc.workflow_id == workflow_id and inc.rule_name == "RULE_CUMULATIVE_DATA_EXFILTRATION_THRESHOLD"
            ]
            if not existing:
                correlated_ids = [e.event_id for e in volume_events]
                affected_agents = list({e.source_agent_id for e in volume_events})
                inc = audit_store.record_incident(
                    rule_name="RULE_CUMULATIVE_DATA_EXFILTRATION_THRESHOLD",
                    description=(
                        f"Cumulative volume threshold breach: {total_bytes} bytes accumulated across {len(volume_events)} "
                        f"operations within sliding time window (threshold: {self.data_read_threshold_bytes} bytes). "
                        "Potential slow-and-low data exfiltration."
                    ),
                    workflow_id=workflow_id,
                    correlated_event_ids=correlated_ids,
                    affected_agents=affected_agents,
                    severity="HIGH"
                )
                new_incidents.append(inc)

        return new_incidents

temporal_analyzer = TemporalRiskAnalyzer()
