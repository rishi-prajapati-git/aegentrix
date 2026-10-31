import pytest
import json
import yaml
from datetime import datetime, timezone, timedelta
from pathlib import Path

from backend.app.models.policy import (
    PolicyRule,
    PolicyBundle,
    OperationType,
    DecisionType,
    ReasonCode
)
from backend.app.services.policy_engine import policy_engine
from backend.app.services.approval_manager import approval_manager
from backend.app.core.security import (
    sign_approval,
    verify_approval_signature,
    build_approval_canonical_string
)

@pytest.fixture(autouse=True)
def reset_approvals_and_policies():
    approval_manager.clear()
    policy_engine._initialize_default_rules()
    yield

def test_cryptographic_hmac_signature_generation():
    """Verify approval creation generates an HMAC-SHA256 signature and verifiable token."""
    appr = approval_manager.create_approval(
        actor="admin://secops-lead",
        target_agent_id="agent://research-01",
        scope_resource="res://finance/restricted_balance_sheet.xlsx",
        operation="READ",
        duration_minutes=30
    )

    assert appr.approval_id.startswith("appr_")
    assert appr.signature is not None
    assert len(appr.signature) == 64  # SHA256 hex digest
    assert appr.token == f"{appr.approval_id}.{appr.signature}"
    assert appr.algorithm == "HMAC-SHA256"

    # Verify signature passes verification
    is_valid = verify_approval_signature(
        approval_id=appr.approval_id,
        actor=appr.actor,
        target_agent_id=appr.target_agent_id,
        scope_resource=appr.scope_resource,
        operation=appr.operation,
        destination=appr.destination,
        created_at=appr.created_at,
        expires_at=appr.expires_at,
        signature=appr.signature
    )
    assert is_valid is True

def test_tampered_approval_record_signature_fails():
    """Verify modifying any property of an approval record invalidates HMAC verification."""
    appr = approval_manager.create_approval(
        actor="admin://secops-lead",
        target_agent_id="agent://research-01",
        scope_resource="res://finance/q3_summary",
        operation="READ",
        duration_minutes=30
    )

    # Tamper with scope_resource in the record
    original_resource = appr.scope_resource
    appr.scope_resource = "res://finance/unauthorized_payroll_master"

    # Attempt validation
    valid, reason = approval_manager.validate_approval(
        approval_id_or_token=appr.approval_id,
        agent_id="agent://research-01",
        operation="READ",
        resource="res://finance/unauthorized_payroll_master"
    )
    assert valid is False
    assert reason == "APPROVAL_SIGNATURE_INVALID"

    # Restore and verify it passes again
    appr.scope_resource = original_resource
    valid2, reason2 = approval_manager.validate_approval(
        approval_id_or_token=appr.approval_id,
        agent_id="agent://research-01",
        operation="READ",
        resource="res://finance/q3_summary"
    )
    assert valid2 is True
    assert reason2 == "AUTHORIZED"

def test_tampered_signature_token_fails():
    """Verify an altered signature token string is rejected."""
    appr = approval_manager.create_approval(
        actor="admin://secops-lead",
        target_agent_id="agent://research-01",
        scope_resource="res://finance/q3_summary",
        operation="READ",
        duration_minutes=30
    )

    # Alter the last character of the signature
    corrupted_sig = appr.signature[:-1] + ("0" if appr.signature[-1] != "0" else "1")
    tampered_token = f"{appr.approval_id}.{corrupted_sig}"

    valid, reason = approval_manager.validate_approval(
        approval_id_or_token=tampered_token,
        agent_id="agent://research-01",
        operation="READ",
        resource="res://finance/q3_summary"
    )
    assert valid is False
    assert reason == "APPROVAL_SIGNATURE_INVALID"

def test_token_format_validation():
    """Verify passing full 'approval_id.signature' token format is supported and authorized."""
    appr = approval_manager.create_approval(
        actor="admin://secops-lead",
        target_agent_id="agent://research-01",
        scope_resource="res://finance/q3_summary",
        operation="READ",
        duration_minutes=30
    )

    # Validate using full token string
    valid, reason = approval_manager.validate_approval(
        approval_id_or_token=appr.token,
        agent_id="agent://research-01",
        operation="READ",
        resource="res://finance/q3_summary"
    )
    assert valid is True
    assert reason == "AUTHORIZED"

def test_revoked_approval_fails():
    """Verify revoked approval token cannot be used."""
    appr = approval_manager.create_approval(
        actor="admin://secops-lead",
        target_agent_id="agent://research-01",
        scope_resource="res://finance/q3_summary",
        operation="READ",
        duration_minutes=30
    )

    revoked = approval_manager.revoke_approval(appr.approval_id)
    assert revoked is True

    valid, reason = approval_manager.validate_approval(
        approval_id_or_token=appr.approval_id,
        agent_id="agent://research-01",
        operation="READ",
        resource="res://finance/q3_summary"
    )
    assert valid is False
    assert reason == "APPROVAL_NOT_ACTIVE"

def test_expired_approval_fails():
    """Verify expired approval cannot authorize requests."""
    # Create an approval that expired in the past
    past_time = datetime.now(timezone.utc) - timedelta(minutes=10)
    created_time = past_time - timedelta(minutes=30)
    approval_id = "appr_test_expired_123"

    sig = sign_approval(
        approval_id=approval_id,
        actor="admin://secops-lead",
        target_agent_id="agent://research-01",
        scope_resource="res://finance/q3_summary",
        operation="READ",
        destination=None,
        created_at=created_time.isoformat(),
        expires_at=past_time.isoformat()
    )

    from backend.app.models.approval import ApprovalRecord
    expired_record = ApprovalRecord(
        approval_id=approval_id,
        actor="admin://secops-lead",
        target_agent_id="agent://research-01",
        scope_resource="res://finance/q3_summary",
        operation="READ",
        destination=None,
        created_at=created_time.isoformat(),
        expires_at=past_time.isoformat(),
        status="ACTIVE",
        signature=sig,
        token=f"{approval_id}.{sig}"
    )
    approval_manager._approvals[approval_id] = expired_record

    valid, reason = approval_manager.validate_approval(
        approval_id_or_token=approval_id,
        agent_id="agent://research-01",
        operation="READ",
        resource="res://finance/q3_summary"
    )
    assert valid is False
    assert reason == "APPROVAL_EXPIRED"
    assert expired_record.status == "EXPIRED"

def test_policy_bundle_export_to_json_and_yaml():
    """Verify exporting policy rules to JSON and YAML format strings."""
    bundle = policy_engine.export_bundle(author="auditor@aegentrix.local", description="Test Export")
    assert bundle.version == "1.0"
    assert len(bundle.rules) >= 6

    # Test JSON export
    json_str = policy_engine.export_to_json()
    parsed_json = json.loads(json_str)
    assert "rules" in parsed_json
    assert len(parsed_json["rules"]) == len(bundle.rules)

    # Test YAML export
    yaml_str = policy_engine.export_to_yaml()
    parsed_yaml = yaml.safe_load(yaml_str)
    assert "rules" in parsed_yaml
    assert len(parsed_yaml["rules"]) == len(bundle.rules)
    assert parsed_yaml["rules"][0]["policy_id"] == "POL-CORP-001"

def test_policy_bundle_import_from_json_and_yaml():
    """Verify round-trip import from JSON and YAML restores rules."""
    # Export current rules to YAML
    yaml_str = policy_engine.export_to_yaml()

    # Clear current engine rules
    policy_engine._rules = []
    assert len(policy_engine.list_policies()) == 0

    # Import from YAML
    imported_count = policy_engine.import_from_yaml(yaml_str, overwrite=True)
    assert imported_count >= 6
    assert len(policy_engine.list_policies()) >= 6
    assert policy_engine.get_policy("POL-CORP-001") is not None

    # Export to JSON
    json_str = policy_engine.export_to_json()
    policy_engine._rules = []
    imported_json_count = policy_engine.import_from_json(json_str, overwrite=True)
    assert imported_json_count == imported_count
    assert policy_engine.get_policy("POL-CORP-004").requires_verifiable_approval is True

def test_policy_export_and_load_file(tmp_path: Path):
    """Verify file-based policy persistence to and from disk."""
    yaml_file = tmp_path / "custom_policies.yaml"
    json_file = tmp_path / "custom_policies.json"

    # Export to file
    policy_engine.export_to_file(str(yaml_file))
    assert yaml_file.exists()
    assert "POL-CORP-001" in yaml_file.read_text(encoding="utf-8")

    policy_engine.export_to_file(str(json_file))
    assert json_file.exists()
    assert "POL-CORP-001" in json_file.read_text(encoding="utf-8")

    # Load back from file
    policy_engine._rules = []
    count = policy_engine.load_from_file(str(yaml_file), overwrite=True)
    assert count >= 6
    assert len(policy_engine.list_policies()) >= 6

def test_policy_bundle_schema_validation_rejection():
    """Verify that importing malformed policy data is rejected with validation error."""
    malformed_yaml = """
version: "1.0"
rules:
  - policy_id: "POL-INVALID"
    name: "Missing Operation and Decision"
"""
    with pytest.raises(Exception):
        policy_engine.import_from_yaml(malformed_yaml)
