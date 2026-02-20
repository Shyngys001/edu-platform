import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.database import engine, Base
from app.routers import auth, student, teacher

# Create tables
Base.metadata.create_all(bind=engine)

BACKEND_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BACKEND_DIR / "static"
UPLOADS_DIR = STATIC_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Frontend SPA (when built and served from backend)
FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "dist"

app = FastAPI(title="PyStart API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(student.router)
app.include_router(teacher.router)

# Uploaded files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


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


# Serve frontend SPA (when frontend dist exists - combined deploy)
if FRONTEND_DIST.exists():
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("static"):
            from fastapi import HTTPException
            raise HTTPException(404)
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
