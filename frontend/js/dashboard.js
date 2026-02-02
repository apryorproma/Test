/**
 * Dashboard — renders analysis results, charts, and recommendations.
 */
const Dashboard = (() => {
  function badgeClass(rating) {
    return `badge badge-${rating.toLowerCase()}`;
  }

  function renderSummary(summary) {
    const container = document.getElementById("summary-stats");
    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-value" style="color:var(--accent-blue)">${summary.total_tasks_analyzed}</div>
        <div class="stat-label">Tasks Analyzed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:${Charts.scoreColor(summary.average_ai_readiness)}">${summary.average_ai_readiness}%</div>
        <div class="stat-label">Avg AI Readiness</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--accent-green)">${summary.high_impact_count}</div>
        <div class="stat-label">High Impact</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--accent-purple)">${summary.quick_win_count}</div>
        <div class="stat-label">Quick Wins</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--accent-amber)">${summary.estimated_total_hours_saved}h</div>
        <div class="stat-label">Hours Saved / Week</div>
      </div>
    `;
  }

  function renderTopRecs(recs) {
    const list = document.getElementById("top-recs-list");
    list.innerHTML = recs.map((r) => `<li style="margin-bottom:0.4rem">${r}</li>`).join("");
  }

  function renderUseCases(useCases) {
    return useCases
      .map(
        (uc) => `
      <div class="use-case-card">
        <h4>
          ${uc.quick_win ? '<span class="badge badge-quick-win">Quick Win</span>' : ""}
          ${uc.title}
        </h4>
        <p>${uc.description}</p>
        <div class="flex-between" style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.4rem">
          <span>Est. time saved: <strong style="color:var(--accent-green)">${uc.estimated_time_saved_pct}%</strong></span>
          <span>Complexity: <strong>${uc.implementation_complexity}</strong></span>
        </div>
        <div class="tech-tags">
          ${uc.ai_techniques.map((t) => `<span class="tech-tag">${t}</span>`).join("")}
        </div>
      </div>`
      )
      .join("");
  }

  function renderTaskDetail(task) {
    const id = `task-detail-${Math.random().toString(36).slice(2, 9)}`;
    return `
    <div class="card task-accordion" style="cursor:pointer" onclick="Dashboard.toggleTask('${id}')">
      <div class="task-header">
        <div>
          <h4 style="display:inline">${task.task_name}</h4>
          <span class="${badgeClass(task.rating)}" style="margin-left:0.5rem">${task.rating} — ${task.overall_score}%</span>
        </div>
        <span class="text-muted" style="font-size:0.85rem">Click to expand</span>
      </div>
      <div class="task-details" id="${id}">
        <p style="margin-bottom:1rem;color:var(--text-secondary)">${task.summary}</p>
        <div style="display:grid;grid-template-columns:1fr 160px;gap:1.5rem;align-items:start">
          <div>
            <h4 style="margin-bottom:0.75rem;font-size:0.9rem;color:var(--text-muted)">Dimension Scores</h4>
            <div class="dim-chart-${id}"></div>
          </div>
          <div style="text-align:center">
            <h4 style="margin-bottom:0.5rem;font-size:0.9rem;color:var(--text-muted)">Overall</h4>
            <div class="gauge-${id}"></div>
          </div>
        </div>
        <h4 style="margin-top:1.25rem;margin-bottom:0.5rem;font-size:0.95rem">Identified AI Use Cases</h4>
        ${renderUseCases(task.use_cases)}
        <div style="margin-top:0.75rem;padding:0.75rem;background:var(--bg-primary);border-radius:var(--radius-sm);border-left:3px solid var(--accent-green)">
          <strong style="font-size:0.85rem;color:var(--accent-green)">Top Recommendation:</strong>
          <span style="font-size:0.9rem;color:var(--text-secondary);margin-left:0.3rem">${task.top_recommendation}</span>
        </div>
      </div>
    </div>`;
  }

  function renderRoleResults(roles) {
    const container = document.getElementById("role-results");
    container.innerHTML = roles
      .map(
        (role) => `
      <div class="card" style="border-left:3px solid var(--accent-green)">
        <div class="flex-between mb-1">
          <div>
            <h3>${role.job_title}</h3>
            <span class="text-muted" style="font-size:0.85rem">${role.department}</span>
          </div>
          <div style="text-align:right">
            <span class="${badgeClass(scoreToRating(role.overall_score))}" style="font-size:0.9rem">
              ${role.overall_score}% AI Ready
            </span>
            <div class="text-muted" style="font-size:0.82rem;margin-top:0.25rem">
              ${role.total_use_cases} use cases &middot; ~${role.estimated_hours_saved_per_week}h saved/week
            </div>
          </div>
        </div>
        ${role.top_opportunities.length ? `
          <div style="margin-bottom:1rem">
            <strong style="font-size:0.85rem;color:var(--text-muted)">Top Opportunities:</strong>
            <div style="margin-top:0.3rem">${role.top_opportunities.map((o) => `<span class="badge badge-high" style="margin:0.15rem">${o}</span>`).join("")}</div>
          </div>
        ` : ""}
        ${role.workflows
          .map(
            (wf) => `
          <div class="workflow-section">
            <div class="workflow-header">
              <h3>${wf.workflow_name}</h3>
              <div>
                <span class="${badgeClass(scoreToRating(wf.workflow_score))}">${wf.workflow_score}%</span>
                <span class="text-muted" style="font-size:0.82rem;margin-left:0.5rem">~${wf.total_hours_automatable}h automatable</span>
              </div>
            </div>
            <div class="comparative-chart-${wf.workflow_name.replace(/\s+/g, "-").toLowerCase()}"></div>
            ${wf.tasks.map((t) => renderTaskDetail(t)).join("")}
          </div>`
          )
          .join("")}
      </div>`
      )
      .join("");
  }

  function scoreToRating(score) {
    if (score >= 80) return "Excellent";
    if (score >= 65) return "High";
    if (score >= 45) return "Moderate";
    if (score >= 25) return "Low";
    return "Minimal";
  }

  // ── Render charts after DOM is built ─────────────────────

  function renderChartsForResults(results) {
    results.job_roles.forEach((role) => {
      role.workflows.forEach((wf) => {
        // Comparative bars per workflow
        const compKey = wf.workflow_name.replace(/\s+/g, "-").toLowerCase();
        const compContainer = document.querySelector(`.comparative-chart-${compKey}`);
        if (compContainer) {
          Charts.comparativeBars(
            compContainer,
            wf.tasks.map((t) => ({ name: t.task_name, score: t.overall_score }))
          );
        }

        // Per-task charts
        wf.tasks.forEach((task) => {
          // Find the containers by looking for class names with random IDs
          const taskCards = document.querySelectorAll(".task-accordion");
          taskCards.forEach((card) => {
            const h4 = card.querySelector("h4");
            if (h4 && h4.textContent === task.task_name) {
              const details = card.querySelector(".task-details");
              if (!details) return;
              const dimContainer = details.querySelector("[class^='dim-chart-']");
              const gaugeContainer = details.querySelector("[class^='gauge-']");
              if (dimContainer) Charts.dimensionBars(dimContainer, task.dimensions);
              if (gaugeContainer) Charts.radialGauge(gaugeContainer, task.overall_score);
            }
          });
        });
      });
    });
  }

  function toggleTask(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("open");
  }

  function render(results) {
    document.getElementById("results-empty").classList.add("hidden");
    document.getElementById("results-content").classList.remove("hidden");

    renderSummary(results.summary);
    renderTopRecs(results.summary.top_recommendations);
    renderRoleResults(results.job_roles);

    // Wait for DOM to settle, then render charts
    requestAnimationFrame(() => {
      renderChartsForResults(results);
    });
  }

  return { render, toggleTask };
})();
