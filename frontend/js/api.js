/**
 * API client for communicating with the backend.
 */
const API = (() => {
  const BASE = window.location.origin + "/api";

  async function request(path, options = {}) {
    const url = `${BASE}${path}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  }

  return {
    health: () => request("/health"),
    analyze: (data) =>
      request("/analyze", { method: "POST", body: JSON.stringify(data) }),
    getDemoData: () => request("/demo/data"),
    getDemoResults: () => request("/demo/results"),
  };
})();
