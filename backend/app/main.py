from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.routes import api_router

app = FastAPI(
    title="AEGENTRIX — Secure Multi-Agent AI Coordination and Governance",
    description="Deterministic security and policy governance layer for multi-agent workflows.",
    version="0.1.0"
)

# Robust CORS configuration for Vercel, localhost, and custom domains
origins = settings.allowed_origins
has_wildcard = "*" in origins or origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if has_wildcard else origins,
    allow_credentials=not has_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app" if not has_wildcard else None,
)

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=True)
