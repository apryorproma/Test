"""
Scoring algorithms that aggregate dimension scores into an overall AI-readiness score
and map tasks to potential generative AI use cases.
"""

from __future__ import annotations
from backend.models.schemas import (
    TaskInput, TaskComplexity, DimensionScore, AIUseCase,
)
from backend.analysis.dimensions import DIMENSIONS


def score_task(task: TaskInput) -> tuple[float, list[DimensionScore]]:
    """Return (overall_weighted_score, list_of_dimension_scores) for a task."""
    results: list[DimensionScore] = []
    weighted_total = 0.0
    weight_sum = 0.0

    for dim in DIMENSIONS:
        raw_score, explanation = dim.score_fn(task)
        results.append(
            DimensionScore(
                dimension=dim.name,
                score=round(raw_score, 1),
                explanation=explanation,
                weight=dim.weight,
            )
        )
        weighted_total += raw_score * dim.weight
        weight_sum += dim.weight

    overall = round(weighted_total / weight_sum, 1) if weight_sum else 0
    return overall, results


def rating_label(score: float) -> str:
    if score >= 80:
        return "Excellent"
    if score >= 65:
        return "High"
    if score >= 45:
        return "Moderate"
    if score >= 25:
        return "Low"
    return "Minimal"


# ── Use-case mapping ────────────────────────────────────────────

_USE_CASE_TEMPLATES: list[dict] = [
    {
        "condition": lambda t: t.has_clear_rules and t.output_is_structured and "text" in [d.value for d in t.data_types],
        "title": "Automated Report & Document Generation",
        "description": "Use generative AI to automatically draft reports, summaries, or structured documents based on input data and templates.",
        "techniques": ["LLM text generation", "Template-based prompting", "RAG (Retrieval-Augmented Generation)"],
        "time_saved": 60,
        "complexity": TaskComplexity.LOW,
    },
    {
        "condition": lambda t: "text" in [d.value for d in t.data_types] and t.frequency.value in ("hourly", "daily"),
        "title": "Intelligent Email & Message Drafting",
        "description": "AI drafts responses to emails, tickets, or messages based on context, tone, and historical patterns.",
        "techniques": ["LLM text generation", "Few-shot prompting", "Sentiment analysis"],
        "time_saved": 45,
        "complexity": TaskComplexity.LOW,
    },
    {
        "condition": lambda t: "numeric" in [d.value for d in t.data_types] or "mixed" in [d.value for d in t.data_types],
        "title": "Data Analysis & Insight Extraction",
        "description": "Generative AI analyzes datasets, identifies patterns, and produces natural-language insights and recommendations.",
        "techniques": ["LLM reasoning", "Code generation for analysis", "Natural language summaries"],
        "time_saved": 50,
        "complexity": TaskComplexity.MEDIUM,
    },
    {
        "condition": lambda t: "code" in [d.value for d in t.data_types],
        "title": "AI-Assisted Code Generation & Review",
        "description": "Use AI to generate boilerplate code, review pull requests, write tests, and suggest improvements.",
        "techniques": ["Code LLMs", "Static analysis + LLM", "Automated test generation"],
        "time_saved": 40,
        "complexity": TaskComplexity.MEDIUM,
    },
    {
        "condition": lambda t: t.requires_creativity,
        "title": "Creative Content Co-Pilot",
        "description": "AI assists with brainstorming, drafting creative content, and iterating on ideas while a human refines the output.",
        "techniques": ["LLM creative generation", "Style transfer", "Iterative prompting"],
        "time_saved": 35,
        "complexity": TaskComplexity.LOW,
    },
    {
        "condition": lambda t: not t.has_clear_rules and t.requires_judgment,
        "title": "Decision Support & Recommendation Engine",
        "description": "AI provides analysis and recommendations for complex decisions, presenting options with trade-offs for human review.",
        "techniques": ["LLM reasoning chains", "RAG with knowledge bases", "Structured output generation"],
        "time_saved": 30,
        "complexity": TaskComplexity.HIGH,
    },
    {
        "condition": lambda t: t.requires_empathy,
        "title": "AI-Augmented Customer Interaction",
        "description": "AI drafts empathetic responses and suggests talking points while a human handles sensitive interactions.",
        "techniques": ["Sentiment-aware LLM", "Few-shot empathy prompting", "Response templating"],
        "time_saved": 25,
        "complexity": TaskComplexity.MEDIUM,
    },
    {
        "condition": lambda t: "image" in [d.value for d in t.data_types],
        "title": "Image Analysis & Generation",
        "description": "AI processes, classifies, or generates images relevant to the workflow.",
        "techniques": ["Vision models", "Image generation", "Multimodal LLMs"],
        "time_saved": 40,
        "complexity": TaskComplexity.MEDIUM,
    },
    {
        "condition": lambda t: t.hours_per_week >= 5 and t.has_clear_rules,
        "title": "Workflow Automation with AI Orchestration",
        "description": "Chain multiple AI capabilities together to automate end-to-end workflows with minimal human intervention.",
        "techniques": ["AI agents", "Function calling", "Workflow orchestration"],
        "time_saved": 55,
        "complexity": TaskComplexity.HIGH,
    },
    {
        "condition": lambda t: t.output_is_structured and t.has_clear_rules,
        "title": "Structured Data Extraction & Transformation",
        "description": "AI extracts structured data from unstructured sources and transforms it into required formats.",
        "techniques": ["LLM extraction", "JSON mode", "Schema-guided generation"],
        "time_saved": 50,
        "complexity": TaskComplexity.LOW,
    },
]


def identify_use_cases(task: TaskInput, overall_score: float) -> list[AIUseCase]:
    """Match a task to relevant generative AI use cases."""
    use_cases: list[AIUseCase] = []
    for template in _USE_CASE_TEMPLATES:
        try:
            if template["condition"](task):
                scaled_time = round(template["time_saved"] * (overall_score / 100), 1)
                use_cases.append(
                    AIUseCase(
                        title=template["title"],
                        description=template["description"],
                        ai_techniques=template["techniques"],
                        estimated_time_saved_pct=scaled_time,
                        implementation_complexity=template["complexity"],
                        quick_win=template["complexity"] == TaskComplexity.LOW and overall_score >= 60,
                    )
                )
        except Exception:
            continue

    # Always add a generic use case if nothing matched
    if not use_cases:
        use_cases.append(
            AIUseCase(
                title="General AI Assistant Integration",
                description="Integrate a general-purpose AI assistant to help with ad-hoc subtasks, research, and drafting within this workflow.",
                ai_techniques=["General LLM", "Conversational AI", "RAG"],
                estimated_time_saved_pct=round(20 * (overall_score / 100), 1),
                implementation_complexity=TaskComplexity.LOW,
                quick_win=overall_score >= 60,
            )
        )

    # Sort: quick wins first, then by time saved
    use_cases.sort(key=lambda u: (-u.quick_win, -u.estimated_time_saved_pct))
    return use_cases
