import os
from typing import List, Optional
from pydantic import BaseModel

class Settings(BaseModel):
    app_name: str = "AEGENTRIX Governance Engine"
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    port: int = int(os.getenv("BACKEND_PORT", "8000"))
    
    # CORS
    allowed_origins: List[str] = [
        origin.strip() 
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    ]

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./backend/data/aegentrix.db")

    # Approvals & Cryptography
    approval_secret_key: str = os.getenv("APPROVAL_SECRET_KEY", "aegentrix-super-secret-hmac-key-2026")
    default_policy_file: str = os.getenv("DEFAULT_POLICY_FILE", "./backend/app/data/policies.yaml")

    # Advisory AI Model Adapter (Open-Weight / Gemma Providers)
    ai_analysis_enabled: bool = os.getenv("AI_ANALYSIS_ENABLED", "false").lower() == "true"
    ai_model_provider: str = os.getenv("AI_MODEL_PROVIDER", "none") # "none", "ollama", "groq", "huggingface", "openai_compatible"
    ai_model_name: str = os.getenv("AI_MODEL_NAME", "gemma-2b-it")
    ai_model_api_key: str = os.getenv("AI_MODEL_API_KEY", "")
    ai_model_base_url: Optional[str] = os.getenv("AI_MODEL_BASE_URL", None)
    ai_model_timeout_seconds: float = float(os.getenv("AI_MODEL_TIMEOUT_SECONDS", "10.0"))

    # Temporal correlation settings
    temporal_window_seconds: int = int(os.getenv("TEMPORAL_WINDOW_SECONDS", "300"))
    max_consecutive_denials_threshold: int = int(os.getenv("MAX_CONSECUTIVE_DENIALS_THRESHOLD", "3"))
    data_read_threshold_bytes: int = int(os.getenv("DATA_READ_THRESHOLD_BYTES", "50000"))

settings = Settings()
