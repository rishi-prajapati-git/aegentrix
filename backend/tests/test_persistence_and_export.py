import pytest
import json
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.audit_store import audit_store
from backend.app.db.session import SessionLocal
from backend.app.db.models import AuditEventDB

client = TestClient(app)

def test_database_persistence_and_export():
    audit_store.clear()

    # Record test event through gateway/store
    ev = audit_store.record_event(
        workflow_id="wf_persist_test",
        correlation_id="corr_persist_test",
        source_agent_id="agent://research-01",
        operation="READ",
        target_resource_or_recipient="res://research/whitepaper.pdf",
        decision="ALLOW",
        reason_code="AUTHORIZED",
        reason_description="Authorized read operation",
        payload_size_bytes=1024
    )
    assert ev.event_id is not None

    # Check persistence in database
    if SessionLocal:
        with SessionLocal() as db:
            row = db.query(AuditEventDB).filter(AuditEventDB.event_id == ev.event_id).first()
            assert row is not None
            assert row.workflow_id == "wf_persist_test"
            assert row.decision == "ALLOW"

    # Test export CSV endpoint (Task 6.2)
    csv_resp = client.get("/api/events/export?format=csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "event_id,timestamp,workflow_id" in csv_resp.text
    assert ev.event_id in csv_resp.text

    # Test export JSON endpoint (Task 6.2)
    json_resp = client.get("/api/events/export?format=json")
    assert json_resp.status_code == 200
    assert "application/json" in json_resp.headers["content-type"]
    data = json_resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["event_id"] == ev.event_id
