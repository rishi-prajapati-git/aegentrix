import pytest
from backend.app.services.policy_engine import policy_engine
from backend.app.services.approval_manager import approval_manager
from backend.app.models.policy import DecisionType, ReasonCode

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
    # Read is allowed
    read_res = policy_engine.evaluate(
        source_agent_id="agent://finance-01",
        operation="READ",
        target_resource="res://finance/general_ledger.csv"
    )
    assert read_res.decision == DecisionType.ALLOW

    # Outbound external transfer is denied / requires approval
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
