from typing import Optional, List, Dict, Any, Type
from pydantic import BaseModel, Field, HttpUrl, field_validator
import re

class DocumentParserParams(BaseModel):
    document_id: str = Field(..., min_length=1, max_length=200, description="Document identifier or path")
    format: str = Field(..., description="Document format: pdf, txt, csv, or json")
    max_pages: Optional[int] = Field(default=50, ge=1, le=500, description="Maximum pages to parse")

    @field_validator("format")
    @classmethod
    def validate_format(cls, v: str) -> str:
        allowed = {"pdf", "txt", "csv", "json", "docx"}
        if v.lower() not in allowed:
            raise ValueError(f"Unsupported format '{v}'. Must be one of {allowed}")
        return v.lower()

class WebScraperParams(BaseModel):
    url: str = Field(..., min_length=8, max_length=2048, description="Target public URL")
    timeout_sec: Optional[int] = Field(default=10, ge=1, le=30, description="Timeout in seconds")

    @field_validator("url")
    @classmethod
    def validate_safe_url(cls, v: str) -> str:
        v_clean = v.strip().lower()
        if not (v_clean.startswith("http://") or v_clean.startswith("https://")):
            raise ValueError("URL scheme must be http or https")
        # SSRF prevention: forbid internal, loopback, private ranges, metadata endpoints
        forbidden_patterns = [
            r"^https?://(127\.|localhost|0\.0\.0\.0|169\.254\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)",
            r"^https?://metadata\.google\.internal",
            r"^https?://.*\.internal"
        ]
        for pattern in forbidden_patterns:
            if re.search(pattern, v_clean):
                raise ValueError("Access to private/internal/loopback addresses is prohibited (SSRF prevention)")
        return v

class LedgerQueryParams(BaseModel):
    fiscal_period: str = Field(..., min_length=4, max_length=20, description="e.g. 2026-Q1, 2025-FY")
    account_id: str = Field(..., min_length=3, max_length=50, description="Sanitized account identifier")
    query_type: str = Field(default="summary", description="Query type: summary, aggregate, or balance")

    @field_validator("query_type")
    @classmethod
    def validate_query_type(cls, v: str) -> str:
        allowed = {"summary", "aggregate", "balance"}
        if v.lower() not in allowed:
            raise ValueError(f"Invalid query_type '{v}'. Allowed: {allowed}")
        return v.lower()

class MetricCalculatorParams(BaseModel):
    metric_name: str = Field(..., min_length=1, max_length=100)
    values: List[float] = Field(..., min_length=1, max_length=10000)
    operation: str = Field(..., description="Calculation operation: sum, mean, median, std")

    @field_validator("operation")
    @classmethod
    def validate_operation(cls, v: str) -> str:
        allowed = {"sum", "mean", "median", "std", "variance"}
        if v.lower() not in allowed:
            raise ValueError(f"Operation '{v}' not supported. Allowed: {allowed}")
        return v.lower()

class EmailDispatcherParams(BaseModel):
    recipient: str = Field(..., min_length=3, max_length=255)
    subject: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1, max_length=10000)

    @field_validator("recipient")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_regex, v.strip()):
            raise ValueError(f"Invalid email recipient format: '{v}'")
        return v.strip()

class SlackNotifierParams(BaseModel):
    channel: str = Field(..., min_length=2, max_length=80)
    message: str = Field(..., min_length=1, max_length=4000)

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        if not v.startswith("#") and not v.startswith("@"):
            raise ValueError("Slack channel must start with '#' or '@'")
        return v

class SandboxHealthCheckParams(BaseModel):
    target_sandbox_id: str = Field(..., min_length=1, max_length=100)
    deep_check: bool = Field(default=False)

class WorkerRebootParams(BaseModel):
    worker_id: str = Field(..., min_length=1, max_length=100)
    force: bool = Field(default=False)

TOOL_PARAM_SCHEMAS: Dict[str, Type[BaseModel]] = {
    "tool://document_parser": DocumentParserParams,
    "tool://web_scraper": WebScraperParams,
    "tool://ledger_query": LedgerQueryParams,
    "tool://metric_calculator": MetricCalculatorParams,
    "tool://email_dispatcher": EmailDispatcherParams,
    "tool://slack_notifier": SlackNotifierParams,
    "tool://sandbox_health_check": SandboxHealthCheckParams,
    "tool://worker_reboot": WorkerRebootParams,
}

def validate_tool_execution(tool_uri: str, params: Optional[Dict[str, Any]]) -> tuple[bool, Optional[str], Optional[BaseModel]]:
    """
    Validates parameters against the registered typed schema for allowlisted tools.
    Returns (is_valid, error_message, parsed_model).
    """
    if tool_uri not in TOOL_PARAM_SCHEMAS:
        return False, f"Tool '{tool_uri}' is not registered in the trusted tool execution catalog.", None

    schema_cls = TOOL_PARAM_SCHEMAS[tool_uri]
    try:
        validated = schema_cls(**(params or {}))
        return True, None, validated
    except Exception as e:
        # Extract clean error message
        return False, str(e), None
