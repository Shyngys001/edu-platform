import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.routers import auth, student, teacher

# Create tables
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app = FastAPI(title="PyStart API", version="1.0.0")

def _normalize_origin(s: str) -> str:
    s = s.strip()
    if not s:
        return ""
    if s.startswith("http://") or s.startswith("https://"):
        return s
    return f"https://{s}"

_origins = [_normalize_origin(o) for o in settings.CORS_ORIGINS.split(",") if o.strip()]
if not _origins:
    _origins = ["https://edu-platform-web.onrender.com", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(student.router)
app.include_router(teacher.router)

# Serve uploaded files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.on_event("startup")
def seed_if_empty():
    """Auto-seed database on first deploy when no users exist."""
    from app.database import SessionLocal
    from app.models.models import User
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            import subprocess
            backend_dir = os.path.dirname(os.path.dirname(__file__))
            subprocess.run(["python", "seed.py"], cwd=backend_dir, capture_output=True, timeout=60)
    except Exception:
        pass  # Don't fail startup if seed errors
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}
