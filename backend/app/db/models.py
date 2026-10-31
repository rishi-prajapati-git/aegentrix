from sqlalchemy import Column, String, Integer, Text, JSON, DateTime
from .session import Base

class AuditEventDB(Base):
    __tablename__ = "audit_events"

    event_id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(String(64), index=True)
    workflow_id = Column(String(64), index=True)
    correlation_id = Column(String(64), index=True)
    source_agent_id = Column(String(64), index=True)
    operation = Column(String(32), index=True)
    target_resource_or_recipient = Column(String(256))
    payload_classification = Column(String(32), default="CONFIDENTIAL")
    payload_size_bytes = Column(Integer, default=0)
    decision = Column(String(32), index=True)
    reason_code = Column(String(64))
    reason_description = Column(Text)
    matched_policy_id = Column(String(64), nullable=True)
    provenance_json = Column(JSON, default=dict)
    advisory_analysis_json = Column(JSON, nullable=True)
    sanitized_metadata_json = Column(JSON, default=dict)

class IncidentDB(Base):
    __tablename__ = "incidents"

    incident_id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(String(64), index=True)
    severity = Column(String(32), default="HIGH")
    rule_name = Column(String(128), index=True)
    description = Column(Text)
    workflow_id = Column(String(64), index=True)
    correlated_event_ids_json = Column(JSON, default=list)
    affected_agents_json = Column(JSON, default=list)
    status = Column(String(32), default="OPEN", index=True)
    updated_at = Column(String(64), nullable=True)
    resolved_by = Column(String(128), nullable=True)
    resolution_notes = Column(Text, nullable=True)

class ApprovalRecordDB(Base):
    __tablename__ = "approvals"

    approval_id = Column(String(64), primary_key=True, index=True)
    actor = Column(String(128))
    target_agent_id = Column(String(64), index=True)
    scope_resource = Column(String(256))
    operation = Column(String(32))
    destination = Column(String(256), nullable=True)
    created_at = Column(String(64))
    expires_at = Column(String(64))
    status = Column(String(32), default="ACTIVE", index=True)
    metadata_json = Column(JSON, default=dict)
    hmac_signature = Column(String(256), nullable=True)
