/**
 * Simple chart rendering using pure SVG — no external dependencies.
 */
const Charts = (() => {
  function createSVG(width, height) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", height);
    svg.style.overflow = "visible";
    return svg;
  }

  function scoreColor(score) {
    if (score >= 80) return "#10b981";
    if (score >= 65) return "#3b82f6";
    if (score >= 45) return "#f59e0b";
    if (score >= 25) return "#f97316";
    return "#ef4444";
  }

  /**
   * Horizontal bar chart — used for dimension scores.
   */
  function dimensionBars(container, dimensions) {
    container.innerHTML = "";
    const barHeight = 32;
    const gap = 12;
    const labelWidth = 150;
    const chartWidth = 500;
    const totalHeight = dimensions.length * (barHeight + gap);

    const svg = createSVG(chartWidth + labelWidth + 60, totalHeight);

    dimensions.forEach((dim, i) => {
      const y = i * (barHeight + gap);
      const barWidth = (dim.score / 100) * chartWidth;

      // Label
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", labelWidth - 8);
      text.setAttribute("y", y + barHeight / 2 + 5);
      text.setAttribute("text-anchor", "end");
      text.setAttribute("fill", "#94a3b8");
      text.setAttribute("font-size", "13");
      text.textContent = dim.dimension;
      svg.appendChild(text);

      // Background bar
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("x", labelWidth);
      bg.setAttribute("y", y);
      bg.setAttribute("width", chartWidth);
      bg.setAttribute("height", barHeight);
      bg.setAttribute("rx", 6);
      bg.setAttribute("fill", "#1e293b");
      svg.appendChild(bg);

      // Score bar
      const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bar.setAttribute("x", labelWidth);
      bar.setAttribute("y", y);
      bar.setAttribute("width", 0);
      bar.setAttribute("height", barHeight);
      bar.setAttribute("rx", 6);
      bar.setAttribute("fill", scoreColor(dim.score));
      bar.style.transition = "width 0.8s ease";
      svg.appendChild(bar);

      // Score label
      const scoreText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      scoreText.setAttribute("x", labelWidth + chartWidth + 8);
      scoreText.setAttribute("y", y + barHeight / 2 + 5);
      scoreText.setAttribute("fill", "#e2e8f0");
      scoreText.setAttribute("font-size", "13");
      scoreText.setAttribute("font-weight", "600");
      scoreText.textContent = `${dim.score}%`;
      svg.appendChild(scoreText);

      // Animate after append
      requestAnimationFrame(() => {
        bar.setAttribute("width", barWidth);
      });
    });

    container.appendChild(svg);
  }

  /**
   * Radial gauge — used for overall scores.
   */
  function radialGauge(container, score, size = 140) {
    container.innerHTML = "";
    const svg = createSVG(size, size);
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 12;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;

    // Background circle
    const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bgCircle.setAttribute("cx", cx);
    bgCircle.setAttribute("cy", cy);
    bgCircle.setAttribute("r", r);
    bgCircle.setAttribute("fill", "none");
    bgCircle.setAttribute("stroke", "#1e293b");
    bgCircle.setAttribute("stroke-width", "10");
    svg.appendChild(bgCircle);

    // Score arc
    const arc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    arc.setAttribute("cx", cx);
    arc.setAttribute("cy", cy);
    arc.setAttribute("r", r);
    arc.setAttribute("fill", "none");
    arc.setAttribute("stroke", scoreColor(score));
    arc.setAttribute("stroke-width", "10");
    arc.setAttribute("stroke-linecap", "round");
    arc.setAttribute("stroke-dasharray", circumference);
    arc.setAttribute("stroke-dashoffset", circumference);
    arc.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
    arc.style.transition = "stroke-dashoffset 1s ease";
    svg.appendChild(arc);

    // Score text
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", cx);
    text.setAttribute("y", cy + 8);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#f1f5f9");
    text.setAttribute("font-size", "28");
    text.setAttribute("font-weight", "700");
    text.textContent = `${Math.round(score)}%`;
    svg.appendChild(text);

    container.appendChild(svg);

    requestAnimationFrame(() => {
      arc.setAttribute("stroke-dashoffset", offset);
    });
  }

  /**
   * Comparative bar chart — used for comparing tasks across a workflow.
   */
  function comparativeBars(container, items) {
    container.innerHTML = "";
    const barHeight = 40;
    const gap = 8;
    const maxLabelWidth = 220;
    const chartWidth = 400;
    const totalHeight = items.length * (barHeight + gap);

    const svg = createSVG(maxLabelWidth + chartWidth + 80, totalHeight + 10);

    items.forEach((item, i) => {
      const y = i * (barHeight + gap) + 5;
      const barWidth = (item.score / 100) * chartWidth;

      // Label
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", maxLabelWidth - 8);
      text.setAttribute("y", y + barHeight / 2 + 5);
      text.setAttribute("text-anchor", "end");
      text.setAttribute("fill", "#cbd5e1");
      text.setAttribute("font-size", "13");
      text.textContent = item.name.length > 30 ? item.name.slice(0, 28) + "…" : item.name;
      svg.appendChild(text);

      // Background
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("x", maxLabelWidth);
      bg.setAttribute("y", y);
      bg.setAttribute("width", chartWidth);
      bg.setAttribute("height", barHeight);
      bg.setAttribute("rx", 6);
      bg.setAttribute("fill", "#1e293b");
      svg.appendChild(bg);

      // Bar
      const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bar.setAttribute("x", maxLabelWidth);
      bar.setAttribute("y", y);
      bar.setAttribute("width", 0);
      bar.setAttribute("height", barHeight);
      bar.setAttribute("rx", 6);
      bar.setAttribute("fill", scoreColor(item.score));
      bar.style.transition = "width 0.8s ease";
      svg.appendChild(bar);

      // Score
      const scoreText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      scoreText.setAttribute("x", maxLabelWidth + chartWidth + 8);
      scoreText.setAttribute("y", y + barHeight / 2 + 5);
      scoreText.setAttribute("fill", "#e2e8f0");
      scoreText.setAttribute("font-size", "14");
      scoreText.setAttribute("font-weight", "600");
      scoreText.textContent = `${item.score}%`;
      svg.appendChild(scoreText);

      requestAnimationFrame(() => {
        bar.setAttribute("width", barWidth);
      });
    });

    container.appendChild(svg);
  }

  return { dimensionBars, radialGauge, comparativeBars, scoreColor };
})();
