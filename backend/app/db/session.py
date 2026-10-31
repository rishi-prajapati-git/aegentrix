import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from ..core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def get_database_url() -> str:
    url = settings.database_url or os.getenv("DATABASE_URL", "sqlite:///./backend/data/aegentrix.db")
    # DigitalOcean App Platform and Heroku provide postgres:// - SQLAlchemy 2.0 requires postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

db_url = get_database_url()

engine = None
SessionLocal = None

try:
    if "sqlite" in db_url:
        # SQLite needs check_same_thread=False
        os.makedirs("./backend/data", exist_ok=True)
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
    else:
        # PostgreSQL with connection pooling
        engine = create_engine(
            db_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=300
        )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.warning(f"Could not connect to database at {db_url}: {e}. Falling back to in-memory SQLite.")
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes tables in database."""
    if engine:
        Base.metadata.create_all(bind=engine)
