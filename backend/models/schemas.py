from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TaskFrequency(str, Enum):
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    AD_HOC = "ad_hoc"


class TaskComplexity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DataType(str, Enum):
    TEXT = "text"
    NUMERIC = "numeric"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    CODE = "code"
    MIXED = "mixed"


# ── Request models ──────────────────────────────────────────────


class TaskInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    frequency: TaskFrequency = TaskFrequency.DAILY
    hours_per_week: float = Field(1.0, ge=0, le=168)
    complexity: TaskComplexity = TaskComplexity.MEDIUM
    requires_judgment: bool = False
    requires_creativity: bool = False
    requires_empathy: bool = False
    data_types: list[DataType] = Field(default_factory=lambda: [DataType.TEXT])
    has_clear_rules: bool = True
    output_is_structured: bool = True
    error_tolerance: float = Field(0.05, ge=0, le=1.0, description="0 = no errors allowed, 1 = fully tolerant")
    current_tools: list[str] = Field(default_factory=list)


class WorkflowInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=2000)
    tasks: list[TaskInput] = Field(..., min_length=1)


class JobRoleInput(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    department: str = Field("", max_length=200)
    description: str = Field("", max_length=2000)
    workflows: list[WorkflowInput] = Field(..., min_length=1)


class AnalysisRequest(BaseModel):
    job_roles: list[JobRoleInput] = Field(..., min_length=1)


# ── Response models ─────────────────────────────────────────────


class DimensionScore(BaseModel):
    dimension: str
    score: float = Field(..., ge=0, le=100)
    explanation: str
    weight: float = Field(1.0, ge=0)


class AIUseCase(BaseModel):
    title: str
    description: str
    ai_techniques: list[str]
    estimated_time_saved_pct: float = Field(..., ge=0, le=100)
    implementation_complexity: TaskComplexity
    quick_win: bool = False


class TaskAnalysis(BaseModel):
    task_name: str
    overall_score: float = Field(..., ge=0, le=100)
    rating: str
    dimensions: list[DimensionScore]
    use_cases: list[AIUseCase]
    summary: str
    top_recommendation: str


class WorkflowAnalysis(BaseModel):
    workflow_name: str
    tasks: list[TaskAnalysis]
    workflow_score: float
    total_hours_automatable: float


class JobRoleAnalysis(BaseModel):
    job_title: str
    department: str
    workflows: list[WorkflowAnalysis]
    overall_score: float
    total_use_cases: int
    top_opportunities: list[str]
    estimated_hours_saved_per_week: float


class AnalysisResponse(BaseModel):
    job_roles: list[JobRoleAnalysis]
    summary: AnalysisSummary


class AnalysisSummary(BaseModel):
    total_tasks_analyzed: int
    average_ai_readiness: float
    high_impact_count: int
    quick_win_count: int
    estimated_total_hours_saved: float
    top_recommendations: list[str]
