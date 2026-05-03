// Seleciona elementos
const body = document.body;
const toggleButton = document.getElementById("toggleMode");

function setToggleIcon(theme) {
  if (!toggleButton) return;
  toggleButton.textContent = theme === "dark" ? "☀️" : "🌙";
}

function applyTheme(theme) {
  body.classList.remove("light-mode", "dark-mode");
  body.classList.add(`${theme}-mode`);
  setToggleIcon(theme);
  localStorage.setItem("site-theme", theme);
}

const savedTheme = localStorage.getItem("site-theme") || "light";
applyTheme(savedTheme);

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    const nextTheme = body.classList.contains("dark-mode") ? "light" : "dark";
    applyTheme(nextTheme);
  });
}
