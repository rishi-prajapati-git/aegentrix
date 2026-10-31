import pytest
from backend.app.services.scenario_runner import scenario_runner
from backend.app.services.audit_store import audit_store

@pytest.fixture(autouse=True)
def clean_audit_store():
    audit_store.clear()
    yield

def test_scenario_1_legitimate():
    res = scenario_runner.run_scenario("scenario-1")
    assert res.overall_decision == "ALLOW"
    assert len(res.events_generated) == 2
    assert all(e.decision == "ALLOW" for e in res.events_generated)

def test_scenario_2_prompt_injection():
    res = scenario_runner.run_scenario("scenario-2")
    assert res.overall_decision == "DENY"
    # Verify advisory flags caught the injection attempt
    flagged = any(e.advisory_model_analysis and e.advisory_model_analysis.flags for e in res.events_generated)
    assert flagged is True

def test_scenario_3_fabricated_approval():
    res = scenario_runner.run_scenario("scenario-3")
    assert res.overall_decision == "DENY"
    assert any(e.reason_code == "APPROVAL_NOT_VERIFIED" for e in res.events_generated)

def test_scenario_4_unauthorized_cross_agent_read():
    res = scenario_runner.run_scenario("scenario-4")
    assert res.overall_decision == "DENY"
    assert any(e.reason_code in ["EXPLICITLY_DENIED_RESOURCE", "UNAUTHORIZED_RESOURCE_ACCESS"] for e in res.events_generated)

def test_scenario_5_unauthorized_external_disclosure():
    res = scenario_runner.run_scenario("scenario-5")
    # Read allowed, transfer denied
    assert res.events_generated[0].decision == "ALLOW"
    assert res.events_generated[1].decision == "DENY"

def test_scenario_6_multi_step_attack_correlation():
    res = scenario_runner.run_scenario("scenario-6")
    assert len(res.incidents_triggered) >= 1
    assert any(inc.rule_name == "RULE_MULTI_STEP_EXFILTRATION_CHAIN" for inc in res.incidents_triggered)

def test_scenario_7_model_unavailable_degraded_mode():
    res = scenario_runner.run_scenario("scenario-7")
    assert res.overall_decision == "DENY"
    assert any(e.advisory_model_analysis and e.advisory_model_analysis.analysis_status == "UNAVAILABLE" for e in res.events_generated)
