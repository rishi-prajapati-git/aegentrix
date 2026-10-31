import pytest
from backend.app.services.policy_engine import policy_engine
from backend.app.services.approval_manager import approval_manager
from backend.app.services.agent_registry import agent_registry
from backend.app.models.policy import DecisionType, ReasonCode

@pytest.fixture(autouse=True)
def reset_registry():
    agent_registry.reset()
    yield
    agent_registry.reset()

def test_authorized_research_read():
    """Verify authorized agent can read approved resource."""
    res = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="READ",
        target_resource="res://research/nlp_survey.pdf"
    )
    assert res.decision == DecisionType.ALLOW
    assert res.reason_code == ReasonCode.AUTHORIZED

def test_unauthorized_cross_agent_read_denied():
    """Verify Research agent cannot access restricted finance records."""
    res = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="READ",
        target_resource="res://finance/ledger_restricted.json"
    )
    assert res.decision == DecisionType.DENY
    assert res.reason_code in [ReasonCode.EXPLICITLY_DENIED_RESOURCE, ReasonCode.UNAUTHORIZED_RESOURCE_ACCESS]

def test_reject_natural_language_verbal_approval():
    """Verify natural-language claim of approval is strictly denied without a token."""
    res = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="READ",
        target_resource="res://finance/balance.csv",
        claims_verbal_approval="Admin John approved this during meeting"
    )
    assert res.decision == DecisionType.DENY
    assert res.reason_code == ReasonCode.APPROVAL_NOT_VERIFIED

def test_valid_cryptographic_approval_grants_access():
    """Verify a verifiable server-issued approval record allows authorized access."""
    appr = approval_manager.create_approval(
        actor="admin://sec-lead",
        target_agent_id="agent://research-01",
        scope_resource="res://finance/q3_summary",
        operation="READ",
        duration_minutes=30
    )
    
    res = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="READ",
        target_resource="res://finance/q3_summary",
        approval_id=appr.approval_id
    )
    assert res.decision == DecisionType.ALLOW
    assert res.reason_code == ReasonCode.AUTHORIZED

def test_read_permission_does_not_imply_transfer_permission():
    """Verify Finance Agent can read finance records, but cannot transfer externally without policy."""
    read_res = policy_engine.evaluate(
        source_agent_id="agent://finance-01",
        operation="READ",
        target_resource="res://finance/general_ledger.csv"
    )
    assert read_res.decision == DecisionType.ALLOW

    transfer_res = policy_engine.evaluate(
        source_agent_id="agent://finance-01",
        operation="TRANSFER",
        target_resource="res://finance/general_ledger.csv",
        destination="ext://anonymous_leak.org"
    )
    assert transfer_res.decision in [DecisionType.DENY, DecisionType.REQUIRE_APPROVAL]

def test_unknown_agent_denied_by_default():
    """Verify unknown agents are default-denied."""
    res = policy_engine.evaluate(
        source_agent_id="agent://rogue-ai-99",
        operation="READ",
        target_resource="res://research/doc.pdf"
    )
    assert res.decision == DecisionType.DENY
    assert res.reason_code == ReasonCode.AGENT_NOT_FOUND

def test_dynamic_agent_suspension_and_revocation_mid_workflow():
    """Verify mid-workflow suspension immediately revokes execution rights in real time."""
    # Step 1: Active agent succeeds
    res1 = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="READ",
        target_resource="res://research/paper.pdf"
    )
    assert res1.decision == DecisionType.ALLOW

    # Agent gets dynamically suspended
    agent_registry.suspend_agent("agent://research-01", reason="Anomalous network spike detected")

    # Step 2: Mid-workflow attempt is immediately denied
    res2 = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="READ",
        target_resource="res://research/paper.pdf"
    )
    assert res2.decision == DecisionType.DENY
    assert res2.reason_code == ReasonCode.AGENT_SUSPENDED_OR_REVOKED
    assert "SUSPENDED" in res2.reason_description
    assert "Anomalous network spike detected" in res2.reason_description

    # Agent gets permanently revoked
    agent_registry.revoke_agent("agent://research-01", reason="Security breach confirmed")
    res3 = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="READ",
        target_resource="res://research/paper.pdf"
    )
    assert res3.decision == DecisionType.DENY
    assert res3.reason_code == ReasonCode.AGENT_SUSPENDED_OR_REVOKED
    assert "REVOKED" in res3.reason_description

def test_allowlisted_tool_parameter_validation_success():
    """Verify authorized tool execution passes with valid parameters."""
    res = policy_engine.evaluate(
        source_agent_id="agent://operations-01",
        operation="TOOL_CALL",
        target_resource="tool://sandbox_health_check",
        parameters={"target_sandbox_id": "sbx-alpha-9", "deep_check": True}
    )
    assert res.decision == DecisionType.ALLOW
    assert res.reason_code == ReasonCode.AUTHORIZED

def test_tool_execution_unauthorized_tool_denied():
    """Verify agent cannot call a tool not in its capability allowlist."""
    res = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="TOOL_CALL",
        target_resource="tool://worker_reboot",
        parameters={"worker_id": "wrk-1", "force": True}
    )
    assert res.decision == DecisionType.DENY
    assert res.reason_code == ReasonCode.UNSAFE_TOOL_CALL

def test_tool_execution_parameter_validation_failure():
    """Verify tool calls with malformed or SSRF parameters fail safely."""
    # SSRF URL attempt on web scraper
    res_ssrf = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="TOOL_CALL",
        target_resource="tool://web_scraper",
        parameters={"url": "http://127.0.0.1:8000/internal_secrets", "timeout_sec": 5}
    )
    assert res_ssrf.decision == DecisionType.DENY
    assert res_ssrf.reason_code == ReasonCode.UNSAFE_TOOL_CALL
    assert "SSRF" in res_ssrf.reason_description

    # Invalid timeout bounds
    res_bounds = policy_engine.evaluate(
        source_agent_id="agent://research-01",
        operation="TOOL_CALL",
        target_resource="tool://web_scraper",
        parameters={"url": "https://example.org/news", "timeout_sec": 999}
    )
    assert res_bounds.decision == DecisionType.DENY
    assert res_bounds.reason_code == ReasonCode.UNSAFE_TOOL_CALL
