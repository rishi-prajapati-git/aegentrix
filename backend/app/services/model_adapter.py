import time
import re
from typing import Optional, List, Dict, Any
from ..models.audit import AdvisoryModelAnalysis
from ..core.config import settings

class AISecurityModelAdapter:
    """
    Advisory AI Security Analysis Adapter.
    Invariant: Model output is strictly advisory. It NEVER grants access or overrides policies.
    """
    def __init__(self):
        self.provider = settings.ai_model_provider
        self.model_name = settings.ai_model_name
        self.enabled = settings.ai_analysis_enabled

    def analyze_untrusted_content(
        self,
        content: str,
        context_metadata: Optional[Dict[str, Any]] = None,
        simulate_failure: bool = False
    ) -> AdvisoryModelAnalysis:
        start_time = time.perf_counter()

        if simulate_failure:
            return AdvisoryModelAnalysis(
                analysis_status="UNAVAILABLE",
                provider=self.provider or "gemma-adapter",
                model_name=self.model_name,
                risk_score=0.0,
                flags=["PROVIDER_UNAVAILABLE_FALLBACK"],
                latency_ms=0.0,
                summary="AI model security endpoint unreachable; policy engine operating under deterministic fail-safe mode."
            )

        # Prompt injection heuristics for fallback/demo analysis
        injection_indicators = [
            (r"(?i)ignore (all )?(previous|prior) (instructions|rules|prompts)", "INSTRUCTION_OVERRIDE_ATTEMPT"),
            (r"(?i)send (all )?(data|finance|secrets|records) to", "EXFILTRATION_INSTRUCTION"),
            (r"(?i)(admin|administrator) (approved|authorized) this", "FABRICATED_AUTHORIZATION_ATTEMPT"),
            (r"(?i)system prompt|developer mode|jailbreak", "JAILBREAK_ATTEMPT"),
            (r"(?i)disregard security policy", "POLICY_BYPASS_ATTEMPT")
        ]

        flags: List[str] = []
        for pattern, flag in injection_indicators:
            if re.search(pattern, content):
                flags.append(flag)

        risk_score = min(1.0, len(flags) * 0.45)
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        summary = (
            f"Advisory signal: detected {len(flags)} risk indicators."
            if flags else "Advisory signal: content exhibits nominal heuristic characteristics."
        )

        return AdvisoryModelAnalysis(
            analysis_status="COMPLETED",
            provider="deterministic-heuristic-evaluator" if self.provider == "none" else self.provider,
            model_name=self.model_name,
            risk_score=risk_score,
            flags=flags,
            latency_ms=round(elapsed_ms, 2),
            summary=summary
        )

model_adapter = AISecurityModelAdapter()
