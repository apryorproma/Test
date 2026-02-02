/**
 * Form handling — builds the input forms for job roles, workflows, and tasks.
 */
const Analyzer = (() => {
  let roleCounter = 0;
  let workflowCounters = {};
  let taskCounters = {};

  const FREQUENCIES = [
    { value: "hourly", label: "Hourly" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "ad_hoc", label: "Ad-hoc" },
  ];

  const COMPLEXITIES = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const DATA_TYPES = [
    { value: "text", label: "Text" },
    { value: "numeric", label: "Numeric" },
    { value: "image", label: "Image" },
    { value: "audio", label: "Audio" },
    { value: "video", label: "Video" },
    { value: "code", label: "Code" },
    { value: "mixed", label: "Mixed" },
  ];

  function selectHTML(name, options, selected = "") {
    const opts = options
      .map(
        (o) =>
          `<option value="${o.value}" ${o.value === selected ? "selected" : ""}>${o.label}</option>`
      )
      .join("");
    return `<select class="form-control" name="${name}">${opts}</select>`;
  }

  function checkboxGroupHTML(name, options, checked = []) {
    return options
      .map(
        (o) =>
          `<label class="checkbox-label">
            <input type="checkbox" name="${name}" value="${o.value}" ${checked.includes(o.value) ? "checked" : ""} />
            ${o.label}
          </label>`
      )
      .join("");
  }

  function createTaskHTML(roleId, wfId, taskId, task = {}) {
    return `
    <div class="card" data-task-id="${taskId}" style="margin-left:1rem;border-left:3px solid var(--accent-purple)">
      <div class="flex-between mb-1">
        <strong style="font-size:0.9rem;color:var(--accent-purple)">Task</strong>
        <button class="btn btn-secondary" style="padding:0.3rem 0.6rem;font-size:0.8rem" onclick="Analyzer.removeTask('${roleId}','${wfId}','${taskId}')">Remove</button>
      </div>
      <div class="form-group">
        <label>Task Name</label>
        <input class="form-control" name="task-name" value="${task.name || ""}" placeholder="e.g., Categorize incoming tickets" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="form-control" name="task-desc" placeholder="What does this task involve?">${task.description || ""}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Frequency</label>
          ${selectHTML("task-frequency", FREQUENCIES, task.frequency || "daily")}
        </div>
        <div class="form-group">
          <label>Hours per Week</label>
          <input class="form-control" type="number" name="task-hours" min="0" max="168" step="0.5" value="${task.hours_per_week ?? 2}" />
        </div>
        <div class="form-group">
          <label>Complexity</label>
          ${selectHTML("task-complexity", COMPLEXITIES, task.complexity || "medium")}
        </div>
        <div class="form-group">
          <label>Error Tolerance (0-1)</label>
          <input class="form-control" type="number" name="task-error-tolerance" min="0" max="1" step="0.01" value="${task.error_tolerance ?? 0.05}" />
        </div>
      </div>
      <div class="form-group">
        <label>Data Types Involved</label>
        <div class="checkbox-group">
          ${checkboxGroupHTML("task-data-types", DATA_TYPES, task.data_types || ["text"])}
        </div>
      </div>
      <div class="form-group">
        <label>Task Characteristics</label>
        <div class="checkbox-group">
          <label class="checkbox-label"><input type="checkbox" name="task-clear-rules" ${task.has_clear_rules !== false ? "checked" : ""} /> Has Clear Rules</label>
          <label class="checkbox-label"><input type="checkbox" name="task-structured-output" ${task.output_is_structured !== false ? "checked" : ""} /> Structured Output</label>
          <label class="checkbox-label"><input type="checkbox" name="task-judgment" ${task.requires_judgment ? "checked" : ""} /> Requires Judgment</label>
          <label class="checkbox-label"><input type="checkbox" name="task-creativity" ${task.requires_creativity ? "checked" : ""} /> Requires Creativity</label>
          <label class="checkbox-label"><input type="checkbox" name="task-empathy" ${task.requires_empathy ? "checked" : ""} /> Requires Empathy</label>
        </div>
      </div>
      <div class="form-group">
        <label>Current Tools (comma-separated)</label>
        <input class="form-control" name="task-tools" value="${(task.current_tools || []).join(", ")}" placeholder="e.g., Excel, Slack, Jira" />
      </div>
    </div>`;
  }

  function createWorkflowHTML(roleId, wfId, wf = {}) {
    const tasksHTML = (wf.tasks || [{}])
      .map((t, i) => {
        const tid = `${wfId}-task-${i}`;
        return createTaskHTML(roleId, wfId, tid, t);
      })
      .join("");

    const taskCount = (wf.tasks || [{}]).length;
    taskCounters[wfId] = taskCount;

    return `
    <div class="card" data-wf-id="${wfId}" style="border-left:3px solid var(--accent-blue)">
      <div class="flex-between mb-1">
        <strong style="color:var(--accent-blue)">Workflow</strong>
        <button class="btn btn-secondary" style="padding:0.3rem 0.6rem;font-size:0.8rem" onclick="Analyzer.removeWorkflow('${roleId}','${wfId}')">Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Workflow Name</label>
          <input class="form-control" name="wf-name" value="${wf.name || ""}" placeholder="e.g., Ticket Resolution" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <input class="form-control" name="wf-desc" value="${wf.description || ""}" placeholder="Brief description" />
        </div>
      </div>
      <div class="tasks-container" data-wf="${wfId}">
        ${tasksHTML}
      </div>
      <button class="btn btn-secondary mt-1" style="font-size:0.85rem" onclick="Analyzer.addTask('${roleId}','${wfId}')">+ Add Task</button>
    </div>`;
  }

  function createRoleHTML(roleId, role = {}) {
    const wfsHTML = (role.workflows || [{}])
      .map((wf, i) => {
        const wfId = `${roleId}-wf-${i}`;
        return createWorkflowHTML(roleId, wfId, wf);
      })
      .join("");

    const wfCount = (role.workflows || [{}]).length;
    workflowCounters[roleId] = wfCount;

    return `
    <div class="card" data-role-id="${roleId}" style="border-left:3px solid var(--accent-green)">
      <div class="flex-between mb-1">
        <strong style="color:var(--accent-green);font-size:1.05rem">Job Role</strong>
        <button class="btn btn-secondary" style="padding:0.3rem 0.6rem;font-size:0.8rem" onclick="Analyzer.removeRole('${roleId}')">Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Job Title</label>
          <input class="form-control" name="role-title" value="${role.title || ""}" placeholder="e.g., Customer Support Manager" />
        </div>
        <div class="form-group">
          <label>Department</label>
          <input class="form-control" name="role-dept" value="${role.department || ""}" placeholder="e.g., Customer Success" />
        </div>
      </div>
      <div class="form-group">
        <label>Role Description</label>
        <textarea class="form-control" name="role-desc" placeholder="What does this role involve?">${role.description || ""}</textarea>
      </div>
      <div class="workflows-container" data-role="${roleId}">
        ${wfsHTML}
      </div>
      <button class="btn btn-secondary mt-1" style="font-size:0.85rem" onclick="Analyzer.addWorkflow('${roleId}')">+ Add Workflow</button>
    </div>`;
  }

  // ── Public methods ───────────────────────────────────────

  function addRole(role = {}) {
    const roleId = `role-${roleCounter++}`;
    const container = document.getElementById("roles-container");
    container.insertAdjacentHTML("beforeend", createRoleHTML(roleId, role));
  }

  function removeRole(roleId) {
    document.querySelector(`[data-role-id="${roleId}"]`)?.remove();
  }

  function addWorkflow(roleId) {
    const wfId = `${roleId}-wf-${workflowCounters[roleId]++}`;
    const container = document.querySelector(`.workflows-container[data-role="${roleId}"]`);
    taskCounters[wfId] = 0;
    container.insertAdjacentHTML("beforeend", createWorkflowHTML(roleId, wfId));
  }

  function removeWorkflow(roleId, wfId) {
    document.querySelector(`[data-wf-id="${wfId}"]`)?.remove();
  }

  function addTask(roleId, wfId) {
    const taskId = `${wfId}-task-${taskCounters[wfId]++}`;
    const container = document.querySelector(`.tasks-container[data-wf="${wfId}"]`);
    container.insertAdjacentHTML("beforeend", createTaskHTML(roleId, wfId, taskId));
  }

  function removeTask(roleId, wfId, taskId) {
    document.querySelector(`[data-task-id="${taskId}"]`)?.remove();
  }

  function collectData() {
    const roles = [];
    document.querySelectorAll("[data-role-id]").forEach((roleEl) => {
      const role = {
        title: roleEl.querySelector('[name="role-title"]').value || "Untitled Role",
        department: roleEl.querySelector('[name="role-dept"]').value || "",
        description: roleEl.querySelector('[name="role-desc"]').value || "",
        workflows: [],
      };

      roleEl.querySelectorAll("[data-wf-id]").forEach((wfEl) => {
        const wf = {
          name: wfEl.querySelector('[name="wf-name"]').value || "Untitled Workflow",
          description: wfEl.querySelector('[name="wf-desc"]').value || "",
          tasks: [],
        };

        wfEl.querySelectorAll("[data-task-id]").forEach((taskEl) => {
          const checkedTypes = Array.from(
            taskEl.querySelectorAll('[name="task-data-types"]:checked')
          ).map((cb) => cb.value);

          wf.tasks.push({
            name: taskEl.querySelector('[name="task-name"]').value || "Untitled Task",
            description: taskEl.querySelector('[name="task-desc"]').value || "No description",
            frequency: taskEl.querySelector('[name="task-frequency"]').value,
            hours_per_week: parseFloat(taskEl.querySelector('[name="task-hours"]').value) || 1,
            complexity: taskEl.querySelector('[name="task-complexity"]').value,
            requires_judgment: taskEl.querySelector('[name="task-judgment"]').checked,
            requires_creativity: taskEl.querySelector('[name="task-creativity"]').checked,
            requires_empathy: taskEl.querySelector('[name="task-empathy"]').checked,
            data_types: checkedTypes.length ? checkedTypes : ["text"],
            has_clear_rules: taskEl.querySelector('[name="task-clear-rules"]').checked,
            output_is_structured: taskEl.querySelector('[name="task-structured-output"]').checked,
            error_tolerance: parseFloat(taskEl.querySelector('[name="task-error-tolerance"]').value) || 0.05,
            current_tools: taskEl.querySelector('[name="task-tools"]').value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          });
        });

        if (wf.tasks.length > 0) role.workflows.push(wf);
      });

      if (role.workflows.length > 0) roles.push(role);
    });

    return { job_roles: roles };
  }

  function loadDemoData(data) {
    const container = document.getElementById("roles-container");
    container.innerHTML = "";
    roleCounter = 0;
    workflowCounters = {};
    taskCounters = {};

    (data.job_roles || []).forEach((role) => addRole(role));
  }

  function clear() {
    document.getElementById("roles-container").innerHTML = "";
    roleCounter = 0;
    workflowCounters = {};
    taskCounters = {};
  }

  return {
    addRole,
    removeRole,
    addWorkflow,
    removeWorkflow,
    addTask,
    removeTask,
    collectData,
    loadDemoData,
    clear,
  };
})();
