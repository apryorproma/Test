import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000",
    "*",
]

API_PREFIX = "/api"
APP_TITLE = "AI Use Case Analyzer"
APP_VERSION = "1.0.0"
