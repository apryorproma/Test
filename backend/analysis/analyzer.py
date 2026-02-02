"""
Core analysis engine that orchestrates the scoring of job roles, workflows, and tasks.
"""

from __future__ import annotations
from backend.models.schemas import (
    AnalysisRequest, AnalysisResponse, AnalysisSummary,
    JobRoleAnalysis, WorkflowAnalysis, TaskAnalysis,
)
from backend.analysis.scorer import score_task, rating_label, identify_use_cases


def analyze(request: AnalysisRequest) -> AnalysisResponse:
    """Run full analysis on all job roles, workflows, and tasks."""
    job_results: list[JobRoleAnalysis] = []
    all_task_scores: list[float] = []
    total_use_cases = 0
    total_quick_wins = 0
    total_hours_saved = 0.0
    global_recommendations: list[str] = []

    for role in request.job_roles:
        wf_results: list[WorkflowAnalysis] = []
        role_scores: list[float] = []
        role_use_cases = 0
        role_hours_saved = 0.0
        role_top_ops: list[str] = []

        for workflow in role.workflows:
            task_results: list[TaskAnalysis] = []
            wf_scores: list[float] = []
            wf_hours_automatable = 0.0

            for task in workflow.tasks:
                overall, dimensions = score_task(task)
                use_cases = identify_use_cases(task, overall)
                rating = rating_label(overall)

                # Estimate automatable hours
                automatable_pct = overall / 100
                hours_saved = round(task.hours_per_week * automatable_pct * 0.6, 1)
                wf_hours_automatable += hours_saved

                # Build summary and recommendation
                summary = _build_task_summary(task.name, overall, rating, len(use_cases))
                top_rec = use_cases[0].title if use_cases else "Explore general AI assistant integration"

                quick_wins = sum(1 for uc in use_cases if uc.quick_win)
                total_quick_wins += quick_wins
                total_use_cases += len(use_cases)
                role_use_cases += len(use_cases)

                if overall >= 65:
                    role_top_ops.append(f"{task.name} ({rating} — {overall}%)")
                    global_recommendations.append(
                        f"[{role.title}] {task.name}: {top_rec} (score: {overall}%)"
                    )

                task_results.append(
                    TaskAnalysis(
                        task_name=task.name,
                        overall_score=overall,
                        rating=rating,
                        dimensions=dimensions,
                        use_cases=use_cases,
                        summary=summary,
                        top_recommendation=top_rec,
                    )
                )
                wf_scores.append(overall)
                all_task_scores.append(overall)

            wf_score = round(sum(wf_scores) / len(wf_scores), 1) if wf_scores else 0
            role_hours_saved += wf_hours_automatable

            wf_results.append(
                WorkflowAnalysis(
                    workflow_name=workflow.name,
                    tasks=task_results,
                    workflow_score=wf_score,
                    total_hours_automatable=round(wf_hours_automatable, 1),
                )
            )
            role_scores.append(wf_score)

        total_hours_saved += role_hours_saved
        role_overall = round(sum(role_scores) / len(role_scores), 1) if role_scores else 0

        job_results.append(
            JobRoleAnalysis(
                job_title=role.title,
                department=role.department,
                workflows=wf_results,
                overall_score=role_overall,
                total_use_cases=role_use_cases,
                top_opportunities=role_top_ops[:5],
                estimated_hours_saved_per_week=round(role_hours_saved, 1),
            )
        )

    avg_readiness = round(sum(all_task_scores) / len(all_task_scores), 1) if all_task_scores else 0
    high_impact = sum(1 for s in all_task_scores if s >= 65)

    # Keep top 5 global recommendations
    global_recommendations.sort(key=lambda r: float(r.split("score: ")[1].rstrip("%)")) if "score: " in r else 0, reverse=True)

    summary = AnalysisSummary(
        total_tasks_analyzed=len(all_task_scores),
        average_ai_readiness=avg_readiness,
        high_impact_count=high_impact,
        quick_win_count=total_quick_wins,
        estimated_total_hours_saved=round(total_hours_saved, 1),
        top_recommendations=global_recommendations[:5],
    )

    return AnalysisResponse(job_roles=job_results, summary=summary)


def _build_task_summary(name: str, score: float, rating: str, use_case_count: int) -> str:
    if score >= 80:
        return (
            f'"{name}" scores {score}% ({rating}) for AI readiness. '
            f"This is an excellent candidate with {use_case_count} identified use case(s). "
            f"Immediate implementation is recommended."
        )
    if score >= 65:
        return (
            f'"{name}" scores {score}% ({rating}) for AI readiness. '
            f"Strong potential with {use_case_count} use case(s). "
            f"Consider piloting AI assistance for this task."
        )
    if score >= 45:
        return (
            f'"{name}" scores {score}% ({rating}) for AI readiness. '
            f"Moderate potential with {use_case_count} use case(s). "
            f"AI can augment parts of this task while humans handle the rest."
        )
    return (
        f'"{name}" scores {score}% ({rating}) for AI readiness. '
        f"Limited AI automation potential, but {use_case_count} assistive use case(s) identified. "
        f"Focus on AI as a co-pilot rather than full automation."
    )
