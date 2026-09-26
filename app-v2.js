
// Preload banner artwork so every writing stage opens with its image ready.
const TRANSWRITE_BANNERS = [
  "./assets/banners/hero-transwrite.png",
  "./assets/banners/my-idea.png",
  "./assets/banners/meaning-bridge.png",
  "./assets/banners/plan-my-text.png",
  "./assets/banners/write-english.png",
  "./assets/banners/check-the-meaning.png",
  "./assets/banners/rewrite.png",
  "./assets/banners/my-reflection.png",
  "./assets/banners/nucleo-pedadogico.png",
  "./assets/banners/intencion.png",
  "./assets/banners/repertorio.png",
  "./assets/banners/progresion.png",
  "./assets/banners/teacher-zone.png"
];

function preloadTransWriteBanners() {
  TRANSWRITE_BANNERS.forEach(src => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  });
}

window.addEventListener("load", preloadTransWriteBanners, { once: true });

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

const exportLabels = {
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

const checkLabels = {
  meaning: "Mi texto conserva la idea central.",
  sequence: "Las ideas siguen una secuencia comprensible.",
  vocabulary: "El vocabulario expresa el significado que necesito.",
  grammar: "Revisé estructuras y formas gramaticales que afectan la claridad.",
  audience: "El texto responde al propósito y al destinatario."
};

function buildExportSections() {
  const state = collectState();
  const sections = Object.entries(exportLabels).map(([key, label]) => ({
    label,
    value: state.values[key] || ""
  }));
  const checks = Object.entries(checkLabels).map(([key, label]) => ({
    label,
    checked: Boolean(state.checks[key])
  }));
  return { sections, checks };
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

document.getElementById("exportWord").addEventListener("click", () => {
  const { sections, checks } = buildExportSections();
  const body = sections.map(section => `
    <h2>${escapeHtml(section.label)}</h2>
    <p>${escapeHtml(section.value) || "&nbsp;"}</p>
  `).join("");

  const checklist = checks.map(item =>
    `<p>${item.checked ? "☒" : "☐"} ${escapeHtml(item.label)}</p>`
  ).join("");

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; margin: 48px; color: #1b2b40; line-height: 1.5; }
      h1 { color: #0d6b5d; margin-bottom: 4px; }
      .subtitle { color: #5f6f82; margin-top: 0; margin-bottom: 32px; }
      h2 { font-size: 14px; color: #0d6b5d; margin-top: 24px; margin-bottom: 6px; }
      p { font-size: 12px; margin-top: 0; }
      .check-title { margin-top: 32px; }
    </style>
  </head>
  <body>
    <h1>TransWrite · El Dorado</h1>
    <p class="subtitle">Ruta de producción textual en inglés mediante translenguaje</p>
    ${body}
    <h2 class="check-title">CHECK THE MEANING</h2>
    ${checklist}
  </body>
  </html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "transwrite-mi-proceso.doc";
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("exportPdf").addEventListener("click", () => {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    window.alert("No fue posible cargar el generador de PDF. Verifica tu conexión e inténtalo nuevamente.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const { sections, checks } = buildExportSections();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  function ensureSpace(required = 16) {
    if (y + required > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TransWrite · El Dorado", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 105, 125);
  doc.text("Ruta de producción textual en inglés mediante translenguaje", margin, y);
  doc.setTextColor(0, 0, 0);
  y += 12;

  sections.forEach(section => {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(13, 107, 93);
    doc.text(section.label, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(25, 40, 58);
    const text = section.value || " ";
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach(line => {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  });

  ensureSpace(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 107, 93);
  doc.text("CHECK THE MEANING", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(25, 40, 58);

  checks.forEach(item => {
    const mark = item.checked ? "[X]" : "[ ]";
    const lines = doc.splitTextToSize(`${mark} ${item.label}`, contentWidth);
    lines.forEach(line => {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5;
    });
    y += 2;
  });

  doc.save("transwrite-mi-proceso.pdf");
});

loadState();
showStep(currentStep);
updateCounts();