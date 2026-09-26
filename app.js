const STORAGE_KEY = "transwrite-el-dorado-v1";
let currentStep = 1;

const tabs = [...document.querySelectorAll(".step-tab")];
const panels = [...document.querySelectorAll(".step-panel")];
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const prevButton = document.getElementById("prevStep");
const nextButton = document.getElementById("nextStep");
const saveState = document.getElementById("saveState");

function showStep(step) {
  currentStep = Math.max(1, Math.min(7, Number(step)));
  tabs.forEach(tab => tab.classList.toggle("active", Number(tab.dataset.step) === currentStep));
  panels.forEach(panel => panel.classList.toggle("active", Number(panel.dataset.panel) === currentStep));
  progressLabel.textContent = `Paso ${currentStep} de 7`;
  progressBar.style.width = `${(currentStep / 7) * 100}%`;
  prevButton.disabled = currentStep === 1;
  nextButton.textContent = currentStep === 7 ? "Volver al inicio ↺" : "Siguiente →";
  document.querySelector(".workspace-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

tabs.forEach(tab => tab.addEventListener("click", () => showStep(tab.dataset.step)));
prevButton.addEventListener("click", () => showStep(currentStep - 1));
nextButton.addEventListener("click", () => showStep(currentStep === 7 ? 1 : currentStep + 1));

function collectState() {
  const values = {};
  document.querySelectorAll("[data-save]").forEach(el => values[el.dataset.save] = el.value);
  const checks = {};
  document.querySelectorAll("[data-check]").forEach(el => checks[el.dataset.check] = el.checked);
  return { values, checks, currentStep, theme: document.body.classList.contains("dark") ? "dark" : "light" };
}

let saveTimer;
function saveStateToLocal() {
  clearTimeout(saveTimer);
  saveState.textContent = "Guardando…";
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState()));
    saveState.textContent = "Guardado local automático";
  }, 250);
}

document.querySelectorAll("[data-save]").forEach(el => el.addEventListener("input", saveStateToLocal));
document.querySelectorAll("[data-check]").forEach(el => el.addEventListener("change", saveStateToLocal));

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    Object.entries(state.values || {}).forEach(([key, value]) => {
      const el = document.querySelector(`[data-save="${key}"]`);
      if (el) el.value = value;
    });
    Object.entries(state.checks || {}).forEach(([key, value]) => {
      const el = document.querySelector(`[data-check="${key}"]`);
      if (el) el.checked = Boolean(value);
    });
    if (state.theme === "dark") document.body.classList.add("dark");
    currentStep = Number(state.currentStep || 1);
  } catch (error) {
    console.warn("No fue posible recuperar el estado local.", error);
  }
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
const firstDraft = document.getElementById("firstDraft");
const finalText = document.getElementById("finalText");
function updateCounts() {
  document.getElementById("draftWords").textContent = countWords(firstDraft.value);
  document.getElementById("finalWords").textContent = countWords(finalText.value);
}
firstDraft.addEventListener("input", updateCounts);
finalText.addEventListener("input", updateCounts);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  saveStateToLocal();
});

document.getElementById("clearWork").addEventListener("click", () => {
  const ok = window.confirm("¿Deseas borrar todo el trabajo guardado en este navegador?");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  document.querySelectorAll("[data-save]").forEach(el => el.value = "");
  document.querySelectorAll("[data-check]").forEach(el => el.checked = false);
  updateCounts();
  showStep(1);
});

document.getElementById("exportWork").addEventListener("click", () => {
  const state = collectState();
  const labels = {
    ideaPurpose: "PROPÓSITO",
    ideaAudience: "DESTINATARIO",
    ideaText: "IDEA INICIAL",
    knownWords: "WORDS I KNOW",
    needWords: "WORDS I NEED",
    bridgeNotes: "MEANING BRIDGE - NOTAS",
    opening: "OPENING",
    development: "DEVELOPMENT",
    closing: "CLOSING",
    firstDraft: "FIRST DRAFT",
    revisionNotes: "REVISION NOTES",
    finalText: "FINAL ENGLISH TEXT",
    helpfulResources: "RECURSOS QUE FUERON ÚTILES",
    mainChange: "CAMBIO PRINCIPAL",
    nextGoal: "PRÓXIMA META"
  };
  const lines = [
    "TRANSWRITE · EL DORADO",
    "Ruta de producción textual en inglés mediante translenguaje",
    "==========================================================",
    ""
  ];
  Object.entries(labels).forEach(([key, label]) => {
    lines.push(label, state.values[key] || "", "");
  });
  lines.push("CHECK THE MEANING");
  Object.entries(state.checks).forEach(([key, checked]) => lines.push(`[${checked ? "x" : " "}] ${key}`));
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "transwrite-mi-proceso.txt";
  link.click();
  URL.revokeObjectURL(url);
});

loadState();
showStep(currentStep);
updateCounts();