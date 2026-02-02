# AI Use Case Analyzer

A platform that analyzes job roles, workflows, and tasks to identify use cases ripe for generative AI adoption.

## What It Does

- **Input** job roles with their workflows and individual tasks
- **Score** each task across 6 dimensions of AI readiness (repetitiveness, volume, rule clarity, data compatibility, error tolerance, human element)
- **Identify** specific generative AI use cases with estimated time savings and implementation complexity
- **Visualize** results in an interactive dashboard with charts, scores, and prioritized recommendations

## Architecture

```
backend/                    # Python FastAPI backend
  main.py                   # API entry point (serves frontend + REST endpoints)
  config.py                 # CORS and app configuration
  analysis/
    analyzer.py             # Core orchestration engine
    dimensions.py           # 6 scoring dimensions with weighted evaluation
    scorer.py               # Scoring algorithms + use-case matching
  models/
    schemas.py              # Pydantic request/response models
  data/
    sample_data.json        # Demo dataset (4 roles, 14 tasks)

frontend/                   # Vanilla HTML/CSS/JS frontend
  index.html                # Single-page application
  css/style.css             # Dark-themed responsive styles
  js/
    app.js                  # Initialization and routing
    api.js                  # Backend API client
    analyzer.js             # Form builder and data collection
    dashboard.js            # Results rendering
    charts.js               # SVG-based charts (no dependencies)
```

## Quick Start

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run the server
cd <project-root>
uvicorn backend.main:app --reload --port 8000

# Open http://localhost:8000 in your browser
```

## API Endpoints

| Method | Path               | Description                        |
|--------|--------------------|------------------------------------|
| GET    | `/api/health`      | Health check                       |
| POST   | `/api/analyze`     | Analyze job roles and tasks        |
| GET    | `/api/demo/data`   | Load sample input data             |
| GET    | `/api/demo/results`| Run analysis on sample data        |

## Scoring Dimensions

Each task is evaluated on 6 weighted dimensions (0–100):

1. **Repetitiveness** (weight 1.2) — frequency and pattern predictability
2. **Volume & Scale** (weight 1.1) — hours per week and throughput
3. **Rule Clarity** (weight 1.0) — how well-defined rules and outputs are
4. **Data Compatibility** (weight 0.9) — how well AI handles the data types
5. **Error Tolerance** (weight 0.8) — how tolerant the task is of imperfect output
6. **Human Element** (weight 1.0) — inverse of judgment, creativity, empathy needs

The weighted average produces an overall AI readiness score, which maps to use cases from a template library covering document generation, email drafting, data analysis, code assistance, creative co-piloting, decision support, and more.

## Demo Data

Click **Load Demo Data** in the UI to populate 4 sample roles:
- Customer Support Manager (5 tasks)
- Marketing Content Specialist (4 tasks)
- Financial Analyst (5 tasks)
- Software Developer (4 tasks)
