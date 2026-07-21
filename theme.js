// ================================
// Dark / light mode — shared by every page, including admin.html.
// Does NOT depend on i18n.js (admin.html doesn't load it), so this
// stays a self-contained, minimal script.
// Usage: any button with class="theme-toggle" becomes a working toggle.
// ================================

const THEME_KEY = "hmc_theme";

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY);
}

function getPreferredTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  });
}

function initThemeToggle() {
  applyTheme(getStoredTheme() || getPreferredTheme());
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  });
}

document.addEventListener("DOMContentLoaded", initThemeToggle);
