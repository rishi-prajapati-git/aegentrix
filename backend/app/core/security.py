import re
import hmac
import hashlib
from typing import Any, Dict, Optional

# Patterns for sensitive keys and tokens
SENSITIVE_KEY_PATTERN = re.compile(
    r"(?i)(api[_-]?key|secret|password|token|bearer|authorization|credential|private[_-]?key)"
)
JWT_PATTERN = re.compile(r"eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}")
API_KEY_PATTERN = re.compile(r"(?i)(sk-[a-zA-Z0-9]{20,}|key-[a-zA-Z0-9]{20,})")

def sanitize_value(key: str, val: Any) -> Any:
    """Sanitize individual values if key indicates sensitive information."""
    if isinstance(val, str):
        if SENSITIVE_KEY_PATTERN.search(key):
            return "[REDACTED_SECRET]"
        val = JWT_PATTERN.sub("[REDACTED_JWT]", val)
        val = API_KEY_PATTERN.sub("[REDACTED_KEY]", val)
        return val
    elif isinstance(val, dict):
        return sanitize_payload(val)
    elif isinstance(val, list):
        return [sanitize_value(key, item) for item in val]
    return val

def sanitize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively redacts secrets and credentials from payloads before logging/audit."""
    if not isinstance(payload, dict):
        return payload
    sanitized = {}
    for k, v in payload.items():
        if SENSITIVE_KEY_PATTERN.search(k):
            sanitized[k] = "[REDACTED_SECRET]"
        elif isinstance(v, dict):
            sanitized[k] = sanitize_payload(v)
        elif isinstance(v, list):
            sanitized[k] = [sanitize_value(k, item) for item in v]
        elif isinstance(v, str):
            v_clean = JWT_PATTERN.sub("[REDACTED_JWT]", v)
            v_clean = API_KEY_PATTERN.sub("[REDACTED_KEY]", v_clean)
            sanitized[k] = v_clean
        else:
            sanitized[k] = v
    return sanitized

# Cryptographic HMAC Digital Signatures for Verifiable Approvals

def get_hmac_secret(secret_key: Optional[str] = None) -> bytes:
    """Retrieve secret key for HMAC computation."""
    if secret_key:
        return secret_key.encode("utf-8")
    try:
        from .config import settings
        return settings.approval_secret_key.encode("utf-8")
    except Exception:
        return b"aegentrix-default-fallback-hmac-key-2026"

def compute_hmac_sha256(message: str, secret_key: Optional[str] = None) -> str:
    """Computes HMAC-SHA256 hex digest for a message."""
    key_bytes = get_hmac_secret(secret_key)
    return hmac.new(key_bytes, message.encode("utf-8"), hashlib.sha256).hexdigest()

def verify_hmac_sha256(message: str, signature: str, secret_key: Optional[str] = None) -> bool:
    """Constant-time verification of an HMAC-SHA256 signature."""
    if not signature or not isinstance(signature, str):
        return False
    expected = compute_hmac_sha256(message, secret_key)
    return hmac.compare_digest(expected, signature)

def build_approval_canonical_string(
    approval_id: str,
    actor: str,
    target_agent_id: str,
    scope_resource: str,
    operation: str,
    destination: Optional[str],
    created_at: str,
    expires_at: str
) -> str:
    """
    Constructs a deterministic canonical string representing the approval record
    to ensure HMAC signature covers all tamper-sensitive properties.
    """
    dest_str = destination if destination is not None else ""
    return f"{approval_id}|{actor}|{target_agent_id}|{scope_resource}|{operation}|{dest_str}|{created_at}|{expires_at}"

def sign_approval(
    approval_id: str,
    actor: str,
    target_agent_id: str,
    scope_resource: str,
    operation: str,
    destination: Optional[str],
    created_at: str,
    expires_at: str,
    secret_key: Optional[str] = None
) -> str:
    """Produces cryptographic HMAC signature for an approval record."""
    canonical = build_approval_canonical_string(
        approval_id, actor, target_agent_id, scope_resource, operation, destination, created_at, expires_at
    )
    return compute_hmac_sha256(canonical, secret_key)

def verify_approval_signature(
    approval_id: str,
    actor: str,
    target_agent_id: str,
    scope_resource: str,
    operation: str,
    destination: Optional[str],
    created_at: str,
    expires_at: str,
    signature: str,
    secret_key: Optional[str] = None
) -> bool:
    """Verifies cryptographic HMAC signature against approval parameters."""
    canonical = build_approval_canonical_string(
        approval_id, actor, target_agent_id, scope_resource, operation, destination, created_at, expires_at
    )
    return verify_hmac_sha256(canonical, signature, secret_key)
