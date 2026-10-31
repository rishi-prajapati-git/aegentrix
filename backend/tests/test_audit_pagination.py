import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.audit_store import audit_store, encode_cursor, decode_cursor
from backend.app.models.audit import AuditEvent, PaginatedAuditEventsResponse

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_audit_state():
    audit_store.clear()
    yield
    audit_store.clear()

def _populate_test_events(count: int = 75, workflow_id: str = "wf_paginated_test") -> list[str]:
    """Helper to populate N synthetic audit events with sequential timestamps."""
    event_ids = []
    base_time = datetime.now(timezone.utc) - timedelta(minutes=count)
    for i in range(count):
        ev = audit_store.record_event(
            workflow_id=workflow_id,
            correlation_id=f"corr_{i}",
            source_agent_id="agent://research-01" if i % 2 == 0 else "agent://finance-01",
            operation="READ",
            target_resource_or_recipient=f"res://test/doc_{i}.pdf",
            decision="ALLOW" if i % 3 != 0 else "DENY",
            reason_code="AUTHORIZED" if i % 3 != 0 else "UNAUTHORIZED_RESOURCE_ACCESS",
            reason_description=f"Test event {i}",
            payload_size_bytes=1000 + i
        )
        ev.timestamp = (base_time + timedelta(minutes=i)).isoformat()
        event_ids.append(ev.event_id)
    return event_ids

def test_cursor_encoding_and_decoding():
    """Verify cursor token encodes and decodes timestamp and event_id correctly."""
    ts = datetime.now(timezone.utc).isoformat()
    evt_id = "evt_abc123xyz456"

    token = encode_cursor(ts, evt_id)
    assert isinstance(token, str)
    assert len(token) > 0

    decoded_ts, decoded_id = decode_cursor(token)
    assert decoded_ts == ts
    assert decoded_id == evt_id

    # Test direct event_id fallback
    raw_ts, raw_id = decode_cursor("evt_direct_id_123")
    assert raw_ts is None
    assert raw_id == "evt_direct_id_123"

    # Test malformed cursor fallback
    none_ts, none_id = decode_cursor(None)
    assert none_ts is None and none_id is None

def test_audit_store_pagination_forward_and_backward():
    """Verify full forward traversal across multiple pages and backward traversal via cursors."""
    total_events = 55
    page_size = 20
    _populate_test_events(total_events)

    # Page 1 (items 0 to 19 of newest-first)
    page1, next1, prev1, has_more1, total_count1 = audit_store.get_events_paginated(limit=page_size)
    assert len(page1) == 20
    assert total_count1 == 55
    assert has_more1 is True
    assert next1 is not None
    assert prev1 is None

    # Page 2 (items 20 to 39)
    page2, next2, prev2, has_more2, total_count2 = audit_store.get_events_paginated(
        limit=page_size, cursor=next1, direction="next"
    )
    assert len(page2) == 20
    assert has_more2 is True
    assert next2 is not None
    assert prev2 is not None
    # Verify no overlapping items between page 1 and page 2
    page1_ids = {e.event_id for e in page1}
    page2_ids = {e.event_id for e in page2}
    assert page1_ids.isdisjoint(page2_ids)

    # Page 3 (items 40 to 54: final 15 items)
    page3, next3, prev3, has_more3, total_count3 = audit_store.get_events_paginated(
        limit=page_size, cursor=next2, direction="next"
    )
    assert len(page3) == 15
    assert has_more3 is False
    assert next3 is None
    assert prev3 is not None
    page3_ids = {e.event_id for e in page3}
    assert page2_ids.isdisjoint(page3_ids)

    # Traverse backwards from Page 3 using prev3
    page2_back, _, _, _, _ = audit_store.get_events_paginated(
        limit=page_size, cursor=prev3, direction="prev"
    )
    assert len(page2_back) == 20
    assert [e.event_id for e in page2_back] == [e.event_id for e in page2]

def test_audit_pagination_with_filters():
    """Verify cursor pagination respects workflow, agent, and decision filters."""
    _populate_test_events(40, workflow_id="wf_filter_test")
    # Also populate 10 events for a different workflow
    _populate_test_events(10, workflow_id="wf_other")

    # Filter by workflow_id
    page, next_cur, _, has_more, total_count = audit_store.get_events_paginated(
        workflow_id="wf_filter_test",
        limit=15
    )
    assert len(page) == 15
    assert total_count == 40
    assert all(e.workflow_id == "wf_filter_test" for e in page)
    assert has_more is True

    # Filter by decision = "DENY"
    deny_page, _, _, _, deny_total = audit_store.get_events_paginated(
        workflow_id="wf_filter_test",
        decision="DENY",
        limit=50
    )
    assert all(e.decision == "DENY" for e in deny_page)
    assert len(deny_page) == deny_total

def test_api_events_endpoint_cursor_headers():
    """Verify GET /api/events populates X-Next-Cursor and pagination headers."""
    _populate_test_events(35)

    res = client.get("/api/events?limit=15")
    assert res.status_code == 200
    events = res.json()
    assert len(events) == 15
    assert "X-Next-Cursor" in res.headers
    assert res.headers["X-Has-More"] == "true"
    assert res.headers["X-Total-Count"] == "35"

    next_cursor = res.headers["X-Next-Cursor"]
    # Request page 2 using cursor
    res_page2 = client.get(f"/api/events?limit=15&cursor={next_cursor}")
    assert res_page2.status_code == 200
    events_page2 = res_page2.json()
    assert len(events_page2) == 15
    assert events[0]["event_id"] != events_page2[0]["event_id"]

def test_api_events_paginated_endpoint_envelope():
    """Verify GET /api/events/paginated returns typed PaginatedAuditEventsResponse."""
    _populate_test_events(25)

    res = client.get("/api/events/paginated?limit=10")
    assert res.status_code == 200
    data = res.json()

    assert "events" in data
    assert len(data["events"]) == 10
    assert data["total_count"] == 25
    assert data["has_more"] is True
    assert data["next_cursor"] is not None
    assert data["limit"] == 10

    # Fetch second page
    res2 = client.get(f"/api/events/paginated?limit=10&cursor={data['next_cursor']}")
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2["events"]) == 10
    assert data2["has_more"] is True

    # Fetch final page
    res3 = client.get(f"/api/events/paginated?limit=10&cursor={data2['next_cursor']}")
    assert res3.status_code == 200
    data3 = res3.json()
    assert len(data3["events"]) == 5
    assert data3["has_more"] is False
    assert data3["next_cursor"] is None

def test_empty_audit_store_pagination():
    """Verify pagination behavior when audit store contains 0 events."""
    page, next_cur, prev_cur, has_more, total_count = audit_store.get_events_paginated()
    assert len(page) == 0
    assert next_cur is None
    assert prev_cur is None
    assert has_more is False
    assert total_count == 0

    res = client.get("/api/events/paginated")
    assert res.status_code == 200
    data = res.json()
    assert data["events"] == []
    assert data["has_more"] is False
    assert data["total_count"] == 0
