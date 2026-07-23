// ================================
// Theme picker — shared by every page, including admin.html.
// Does NOT depend on i18n.js (reads document.documentElement.lang for
// labels, which i18n.js sets when present, but works standalone too).
// Usage: any button with class="theme-toggle" becomes a working picker
// trigger — clicking it opens a small popover of theme swatches.
// ================================

const THEME_KEY = "hmc_theme";

const THEMES = [
  { key: "light", swatch: "#161616", ar: "أبيض وأسود كلاسيك (فاتح)", en: "Classic Light" },
  { key: "dark", swatch: "#c9973f", ar: "أونيكس وذهبي (داكن)", en: "Onyx & Gold (Dark)" },
  { key: "emerald", swatch: "#1f6e4a", ar: "زمردي", en: "Emerald" },
  { key: "sapphire", swatch: "#1f4e8f", ar: "ياقوتي أزرق", en: "Sapphire" },
  { key: "rosegold", swatch: "#b5657a", ar: "روز جولد", en: "Rose Gold" }
];

function isArabicTheme() {
  return (document.documentElement.lang || "ar") === "ar";
}

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY);
}

function getPreferredTheme() {
  // Light is the site's default look; a visitor's own choice (once made) always wins via localStorage.
  return "light";
}

function applyTheme(theme) {
  const valid = THEMES.some(t => t.key === theme) ? theme : "light";
  localStorage.setItem(THEME_KEY, valid);
  document.documentElement.setAttribute("data-theme", valid);
  const active = THEMES.find(t => t.key === valid) || THEMES[0];
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.style.setProperty("--theme-swatch", active.swatch);
    btn.setAttribute("aria-label", isArabicTheme() ? "غيّري الثيم" : "Change theme");
  });
  document.querySelectorAll(".theme-picker-option").forEach((opt) => {
    opt.classList.toggle("active", opt.dataset.theme === valid);
  });
}

function closeAllThemePopovers() {
  document.querySelectorAll(".theme-picker-popover.open").forEach((p) => p.classList.remove("open"));
}

function buildThemePopover(btn) {
  const popover = document.createElement("div");
  popover.className = "theme-picker-popover";
  popover.innerHTML = THEMES.map((t) => `
    <button type="button" class="theme-picker-option" data-theme="${t.key}">
      <span class="theme-picker-swatch" style="background:${t.swatch};"></span>
      <span>${isArabicTheme() ? t.ar : t.en}</span>
    </button>
  `).join("");
  document.body.appendChild(popover);

  popover.querySelectorAll(".theme-picker-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      applyTheme(opt.dataset.theme);
      closeAllThemePopovers();
    });
  });

  return popover;
}

function initThemeToggle() {
  applyTheme(getStoredTheme() || getPreferredTheme());

  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.textContent = "🎨";
    const popover = buildThemePopover(btn);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = popover.classList.contains("open");
      closeAllThemePopovers();
      if (isOpen) return;
      const rect = btn.getBoundingClientRect();
      popover.style.top = `${rect.bottom + 8}px`;
      if (isArabicTheme()) {
        popover.style.left = `${rect.left}px`;
        popover.style.right = "auto";
      } else {
        popover.style.right = `${window.innerWidth - rect.right}px`;
        popover.style.left = "auto";
      }
      popover.classList.add("open");
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".theme-picker-popover") && !e.target.closest(".theme-toggle")) {
      closeAllThemePopovers();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllThemePopovers();
  });
}

document.addEventListener("DOMContentLoaded", initThemeToggle);
