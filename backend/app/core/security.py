import re
from typing import Any, Dict

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
