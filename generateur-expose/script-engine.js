/**
 * BUROMASTER - ENGINE (Le Cerveau)
 * Regroupe la logique, le rendu, l'IA, et la gestion des données.
 */

// 1. CONFIGURATION ET ÉTAT GLOBAL (Partagés avec l'UI)
const CONFIG = {
    STORAGE_KEY: "buroMaster_premium_save",
    MAX_HISTORY: 30,
    EXPIRATION_MS: 12 * 60 * 60 * 1000 
};

let currentStep = "plan"; 
const stepsOrder = ["plan", "intro", "dev", "conclu"];
let content = { plan: "", intro: "", dev: {}, conclu: "" };
let isLocked = { plan: false, intro: false, dev: false, conclu: false };
let reachedStepIndex = 0;
let currentZoom = 0.6; 
let lastSyncedPlan = ""; 
let historyStack = [];
let redoStack = [];
let editorPreviewTimer = null;

// --- 3. GESTION DE L'HISTORIQUE (UNDO/REDO) ---
function saveToHistory() {
    try {
        if (historyStack.length >= CONFIG.MAX_HISTORY) historyStack.shift();
        historyStack.push(JSON.parse(JSON.stringify({
            content: content,
            isLocked: isLocked,
            reachedStepIndex: reachedStepIndex
        })));
        redoStack = [];
        if (typeof updateHistoryButtons === "function") updateHistoryButtons();
    } catch (err) { console.error("Erreur historique:", err); }
}

function undo() {
    if (historyStack.length === 0) return;
    redoStack.push(JSON.parse(JSON.stringify({ content, isLocked, reachedStepIndex })));
    const prev = historyStack.pop();
    content = prev.content; isLocked = prev.isLocked; reachedStepIndex = prev.reachedStepIndex;
    refreshUIFromData();
    showNotification("Action annulée ↩️");
}

function redo() {
    if (redoStack.length === 0) return;
    historyStack.push(JSON.parse(JSON.stringify({ content, isLocked, reachedStepIndex })));
    const next = redoStack.pop();
    content = next.content; isLocked = next.isLocked; reachedStepIndex = next.reachedStepIndex;
    refreshUIFromData();
    showNotification("Action rétablie ↪️");
}

// --- 4. PERSISTANCE DES DONNÉES ---
function saveData() {
    try {
        const snapshot = {
            content, isLocked, reachedStepIndex,
            theme: document.getElementById("theme")?.value || "",
            studentClass: document.getElementById("studentClass")?.value || "",
            autoFormat: document.getElementById("autoFormatCheckbox")?.checked,
            settings: {
                font: document.getElementById("fontSelect")?.value,
                fontSize: document.getElementById("fontSizeInput")?.value,
                aiLevel: document.getElementById("aiDetailLevel")?.value
            },
            currentStep, lastUpdate: Date.now()
        };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) { console.warn("Erreur sauvegarde:", e); }
}

function loadData() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!saved) return "plan";
        const data = JSON.parse(saved);
        if ((Date.now() - (data.lastUpdate || 0)) > CONFIG.EXPIRATION_MS) return "plan";
        content = data.content || content;
        isLocked = data.isLocked || isLocked;
        reachedStepIndex = data.reachedStepIndex || 0;
        return data.currentStep || "plan";
    } catch (e) { return "plan"; }
}

// --- 9. LOGIQUE DE DÉBORDEMENT ET RENDU ---
function renderTextToPages(title, text, pageObj, onPageBreak, font, size) {
    const maxHeight = 940;
    if (title) {
        const h = document.createElement("div");
        h.className = "page-header-title";
        h.style.fontFamily = font;
        h.textContent = title;
        pageObj.content.appendChild(h);
    }
    if (!text) return;
    const paragraphs = text.split("\n");
    let currentPageArea = pageObj.content;
    let currentPageNum = 1;

    paragraphs.forEach(paraText => {
        const pDiv = document.createElement("div");
        pDiv.className = "text-paragraph";
        pDiv.style.fontFamily = font;
        pDiv.style.fontSize = size + "px";
        currentPageArea.appendChild(pDiv);
        const words = paraText.split(" ");
        words.forEach(word => {
            const testText = pDiv.textContent;
            pDiv.textContent += (pDiv.textContent ? " " : "") + word;
            if (currentPageArea.scrollHeight > maxHeight) {
                pDiv.textContent = testText;
                currentPageNum++;
                currentPageArea = onPageBreak(currentPageNum).content;
                const newP = document.createElement("div");
                newP.className = "text-paragraph";
                newP.style.fontFamily = font;
                newP.style.fontSize = size + "px";
                newP.textContent = word;
                currentPageArea.appendChild(newP);
            }
        });
    });
}

// --- 11. ANALYSEUR DE PLAN ---
function parsePlanForDev(planText) {
    if (!planText || typeof planText !== "string") return [];
    const sections = [];
    const sectionRegex = /^([IVX]+|[0-9]+)\s*[\.\-\)]\s*(.+)/i;
    const subpartRegex = /^([A-Z]|[a-z])\s*[\.\-\)]\s*(.+)/i;
    planText.split('\n').forEach(line => {
        const clean = line.trim();
        const sMatch = clean.match(sectionRegex);
        if (sMatch) sections.push({ fullTitle: clean, titleOnly: sMatch[2].trim(), subparts: [] });
        else if (subpartRegex.test(clean) && sections.length > 0) sections[sections.length-1].subparts.push(clean);
    });
    return sections;
}

// --- 15. COMMUNICATION API IA ---
async function callAiAPI(prompt) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(`${window.location.origin}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        return data.text || null;
    } catch (err) { return null; }
}

