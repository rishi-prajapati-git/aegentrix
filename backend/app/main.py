from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.routes import api_router

app = FastAPI(
    title="AEGENTRIX — Secure Multi-Agent AI Coordination and Governance",
    description="Deterministic security and policy governance layer for multi-agent workflows.",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins if settings.allowed_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=True)
