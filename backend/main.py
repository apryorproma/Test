"""
FastAPI application — AI Use Case Analyzer API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from backend.config import CORS_ORIGINS, API_PREFIX, APP_TITLE, APP_VERSION, DATA_DIR
from backend.models.schemas import AnalysisRequest, AnalysisResponse
from backend.analysis.analyzer import analyze
from backend.utils.helpers import load_json

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

# ── API Routes ──────────────────────────────────────────────────


@app.get(f"{API_PREFIX}/health")
def health():
    return {"status": "ok", "version": APP_VERSION}


@app.post(f"{API_PREFIX}/analyze", response_model=AnalysisResponse)
def analyze_roles(request: AnalysisRequest):
    return analyze(request)


@app.get(f"{API_PREFIX}/demo/data")
def get_demo_data():
    return load_json(DATA_DIR / "sample_data.json")


@app.get(f"{API_PREFIX}/demo/results")
def get_demo_results():
    data = load_json(DATA_DIR / "sample_data.json")
    request = AnalysisRequest(**data)
    return analyze(request)


# ── Serve frontend ──────────────────────────────────────────────

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(str(FRONTEND_DIR / "index.html"))
