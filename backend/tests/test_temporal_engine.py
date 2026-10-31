from datetime import datetime, timezone, timedelta
import pytest
from backend.app.services.temporal_analyzer import temporal_analyzer
from backend.app.services.audit_store import audit_store
from backend.app.services.gateway import gateway

@pytest.fixture(autouse=True)
def clean_audit_store():
    audit_store.clear()
    yield
    audit_store.clear()

def test_sliding_time_window_filtering():
    """Verify events outside the sliding window do not trigger temporal alarms."""
    now = datetime.now(timezone.utc)
    old_time = (now - timedelta(seconds=temporal_analyzer.window_seconds + 60)).isoformat()
    recent_time = now.isoformat()

    # Record 3 denials in the distant past (> 300s ago)
    for i in range(3):
        ev = audit_store.record_event(
            workflow_id="wf_expired_window",
            correlation_id=f"corr_{i}",
            source_agent_id="agent://research-01",
            operation="READ",
            target_resource_or_recipient="res://finance/restricted.csv",
            decision="DENY",
            reason_code="UNAUTHORIZED_RESOURCE_ACCESS",
            reason_description="Denied access"
        )
        ev.timestamp = old_time

    # Active window events should be empty
    active_events = temporal_analyzer.get_window_events(workflow_id="wf_expired_window", reference_time=now)
    assert len(active_events) == 0

    # No incident should trigger because the denials expired outside the sliding window
    incidents = temporal_analyzer.analyze_event_sequence(workflow_id="wf_expired_window", reference_time=now)
    assert len(incidents) == 0

def test_cumulative_byte_size_data_exfiltration_threshold():
    """Verify multiple small reads accumulating past threshold trigger exfiltration alert."""
    workflow_id = "wf_cumulative_exfil"
    corr_id = "corr_exfil_test"

    # Threshold is 50,000 bytes. Execute 3 authorized reads of 20,000 bytes each (Total 60,000 bytes)
    for i in range(3):
        res, ev = gateway.execute_operation(
            workflow_id=workflow_id,
            correlation_id=corr_id,
            source_agent_id="agent://research-01",
            operation="READ",
            target_resource=f"res://research/doc_part_{i}.pdf",
            payload_size_bytes=20000
        )
        assert res.decision.value == "ALLOW"
        assert ev.payload_size_bytes == 20000

    # Verify cumulative rule triggered
    incidents = [
        inc for inc in audit_store.get_incidents()
        if inc.workflow_id == workflow_id and inc.rule_name == "RULE_CUMULATIVE_DATA_EXFILTRATION_THRESHOLD"
    ]
    assert len(incidents) == 1
    inc = incidents[0]
    assert inc.severity == "HIGH"
    assert "Cumulative volume threshold breach" in inc.description
    assert len(inc.correlated_event_ids) == 3
    assert "agent://research-01" in inc.affected_agents

def test_incident_status_update_lifecycle():
    """Verify lifecycle transitions from OPEN -> CONTAINED -> RESOLVED."""
    # Create incident
    inc = audit_store.record_incident(
        rule_name="RULE_REPEATED_ACCESS_PROBING",
        description="Repeated unauthorized probe attempts",
        workflow_id="wf_lifecycle_test",
        correlated_event_ids=["evt_001", "evt_002"],
        affected_agents=["agent://research-01"],
        severity="HIGH"
    )
    assert inc.status == "OPEN"
    assert inc.resolved_by is None

    # Step 1: Transition to CONTAINED
    updated_1 = audit_store.update_incident_status(
        incident_id=inc.incident_id,
        status="CONTAINED",
        actor="admin://sec-analyst",
        notes="Agent tokens revoked and perimeter sandboxed."
    )
    assert updated_1 is not None
    assert updated_1.status == "CONTAINED"
    assert updated_1.resolved_by == "admin://sec-analyst"
    assert "sandboxed" in updated_1.resolution_notes
    assert updated_1.updated_at is not None

    # Step 2: Transition to RESOLVED
    updated_2 = audit_store.update_incident_status(
        incident_id=inc.incident_id,
        status="RESOLVED",
        actor="admin://ciso",
        notes="Root cause mitigated, false-positive rules adjusted."
    )
    assert updated_2.status == "RESOLVED"
    assert updated_2.resolved_by == "admin://ciso"

    # Step 3: Invalid status rejected
    with pytest.raises(ValueError) as exc:
        audit_store.update_incident_status(
            incident_id=inc.incident_id,
            status="INVALID_STATUS"
        )
    assert "Invalid incident status" in str(exc.value)
