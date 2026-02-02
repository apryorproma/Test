/**
 * Main application — initialization, tab routing, and event wiring.
 */
document.addEventListener("DOMContentLoaded", () => {
  // ── Tab navigation ─────────────────────────────────────
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });

  function switchToTab(name) {
    tabBtns.forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === name);
    });
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    document.getElementById(`tab-${name}`).classList.add("active");
  }

  // ── Loading overlay ────────────────────────────────────
  const loadingEl = document.getElementById("loading");
  function showLoading() { loadingEl.classList.add("visible"); }
  function hideLoading() { loadingEl.classList.remove("visible"); }

  // ── Add blank role ─────────────────────────────────────
  document.getElementById("btn-add-role").addEventListener("click", () => {
    Analyzer.addRole();
  });

  // ── Load demo data ─────────────────────────────────────
  document.getElementById("btn-load-demo").addEventListener("click", async () => {
    showLoading();
    try {
      const data = await API.getDemoData();
      Analyzer.loadDemoData(data);
    } catch (err) {
      alert("Failed to load demo data: " + err.message);
    } finally {
      hideLoading();
    }
  });

  // ── Run analysis ───────────────────────────────────────
  document.getElementById("btn-analyze").addEventListener("click", async () => {
    const data = Analyzer.collectData();
    if (!data.job_roles.length) {
      alert("Please add at least one job role with workflows and tasks.");
      return;
    }

    showLoading();
    try {
      const results = await API.analyze(data);
      Dashboard.render(results);
      switchToTab("results");
    } catch (err) {
      alert("Analysis failed: " + err.message);
    } finally {
      hideLoading();
    }
  });

  // ── Start with one blank role ──────────────────────────
  Analyzer.addRole();
});
