"""
Defines the scoring dimensions used to evaluate how suitable a task is for generative AI.

Each dimension has a name, weight, and a scoring function that takes a TaskInput
and returns a score between 0 and 100 along with an explanation.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Callable, TYPE_CHECKING

if TYPE_CHECKING:
    from backend.models.schemas import TaskInput


@dataclass
class Dimension:
    name: str
    description: str
    weight: float
    score_fn: Callable[["TaskInput"], tuple[float, str]]


def _score_repetitiveness(task: "TaskInput") -> tuple[float, str]:
    freq_scores = {
        "hourly": 95,
        "daily": 80,
        "weekly": 60,
        "monthly": 40,
        "quarterly": 20,
        "ad_hoc": 15,
    }
    score = freq_scores.get(task.frequency.value, 50)

    if task.has_clear_rules:
        score = min(100, score + 10)
    if task.output_is_structured:
        score = min(100, score + 5)

    if score >= 75:
        expl = "Highly repetitive task that follows predictable patterns — strong candidate for AI automation."
    elif score >= 50:
        expl = "Moderately repetitive task with some variation — AI can assist with the routine portions."
    else:
        expl = "Low repetitiveness — AI may provide limited automation value but can still assist."
    return score, expl


def _score_volume_and_scale(task: "TaskInput") -> tuple[float, str]:
    hours = task.hours_per_week
    if hours >= 20:
        score = 95
    elif hours >= 10:
        score = 80
    elif hours >= 5:
        score = 65
    elif hours >= 2:
        score = 45
    else:
        score = 25

    freq_bonus = {
        "hourly": 10,
        "daily": 5,
        "weekly": 0,
        "monthly": -5,
        "quarterly": -10,
        "ad_hoc": -10,
    }
    score = max(0, min(100, score + freq_bonus.get(task.frequency.value, 0)))

    if score >= 70:
        expl = f"High volume at {hours}h/week — significant time savings potential through AI."
    elif score >= 40:
        expl = f"Moderate volume at {hours}h/week — AI can deliver meaningful efficiency gains."
    else:
        expl = f"Low volume at {hours}h/week — limited scale benefits, but AI can still improve quality."
    return score, expl


def _score_rule_clarity(task: "TaskInput") -> tuple[float, str]:
    score = 0.0
    reasons = []

    if task.has_clear_rules:
        score += 45
        reasons.append("follows clear rules")
    else:
        score += 15
        reasons.append("rules are ambiguous or context-dependent")

    if task.output_is_structured:
        score += 25
        reasons.append("produces structured output")
    else:
        score += 10
        reasons.append("output is unstructured")

    if not task.requires_judgment:
        score += 20
        reasons.append("minimal human judgment needed")
    else:
        score += 5
        reasons.append("requires human judgment")

    if task.complexity.value == "low":
        score += 10
    elif task.complexity.value == "medium":
        score += 5

    score = min(100, score)
    expl = "Task " + ", ".join(reasons) + "."
    return score, expl


def _score_data_compatibility(task: "TaskInput") -> tuple[float, str]:
    type_scores = {
        "text": 95,
        "code": 90,
        "numeric": 75,
        "mixed": 65,
        "image": 70,
        "audio": 55,
        "video": 40,
    }

    if not task.data_types:
        return 50, "No data types specified — moderate compatibility assumed."

    avg = sum(type_scores.get(dt.value, 50) for dt in task.data_types) / len(task.data_types)

    if avg >= 80:
        expl = "Data types are highly compatible with current generative AI capabilities."
    elif avg >= 55:
        expl = "Data types are moderately compatible — AI can handle these with some configuration."
    else:
        expl = "Data types present challenges for current AI models but are still feasible."
    return round(avg, 1), expl


def _score_error_tolerance(task: "TaskInput") -> tuple[float, str]:
    tolerance = task.error_tolerance
    score = tolerance * 100

    if not task.requires_judgment:
        score = min(100, score + 10)

    score = min(100, max(0, score))

    if score >= 70:
        expl = "High error tolerance makes this ideal for AI — imperfect outputs are acceptable."
    elif score >= 40:
        expl = "Moderate error tolerance — AI outputs will need periodic human review."
    else:
        expl = "Low error tolerance — AI can draft outputs but requires strict human verification."
    return round(score, 1), expl


def _score_human_element(task: "TaskInput") -> tuple[float, str]:
    """Lower human element = higher AI suitability."""
    score = 85.0

    if task.requires_judgment:
        score -= 25
    if task.requires_creativity:
        score -= 20
    if task.requires_empathy:
        score -= 30

    if task.complexity.value == "high":
        score -= 10
    elif task.complexity.value == "low":
        score += 5

    score = max(0, min(100, score))

    traits = []
    if task.requires_judgment:
        traits.append("judgment")
    if task.requires_creativity:
        traits.append("creativity")
    if task.requires_empathy:
        traits.append("empathy")

    if not traits:
        expl = "Task requires minimal uniquely human skills — well suited for full AI handling."
    else:
        expl = f"Task requires {', '.join(traits)} — AI works best as a co-pilot rather than replacement."
    return score, expl


# ── Registry ────────────────────────────────────────────────────

DIMENSIONS: list[Dimension] = [
    Dimension("Repetitiveness", "How repetitive and pattern-based the task is", 1.2, _score_repetitiveness),
    Dimension("Volume & Scale", "Time spent and frequency of the task", 1.1, _score_volume_and_scale),
    Dimension("Rule Clarity", "How well-defined the rules and expected output are", 1.0, _score_rule_clarity),
    Dimension("Data Compatibility", "How well current AI models handle the data types involved", 0.9, _score_data_compatibility),
    Dimension("Error Tolerance", "How tolerant the task is of imperfect outputs", 0.8, _score_error_tolerance),
    Dimension("Human Element", "Inversely scored — lower need for human traits = higher AI fit", 1.0, _score_human_element),
]
