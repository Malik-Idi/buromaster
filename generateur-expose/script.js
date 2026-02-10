document.addEventListener("DOMContentLoaded", function () {
    // --- 1. SÉLECTION DES ÉLÉMENTS DU DOM ---
    const editor = document.getElementById("editor"); 
    const themeInput = document.getElementById("theme");
    const studentClassInput = document.getElementById("studentClass");
    const pagesContainer = document.getElementById("preview-pages");
    const stepTitle = document.getElementById("step-title");
    const validateBtn = document.getElementById("validateBtn");
    const nextStepBtn = document.getElementById("nextStepBtn");
    const generateBtn = document.getElementById("generateBtn");
    const downloadBtn = document.getElementById("downloadPdf");
    const autoFormatCheckbox = document.getElementById("autoFormatCheckbox");
    
    const stepLinks = {
        plan: document.getElementById("link-plan"),
        intro: document.getElementById("link-intro"),
        dev: document.getElementById("link-dev"),
        conclu: document.getElementById("link-conclu")
    };
    
    const advancedOptionsBtn = document.getElementById("advancedOptionsBtn");
    const advancedPanel = document.getElementById("advancedPanel");
    const fontSelect = document.getElementById("fontSelect");
    const fontSizeInput = document.getElementById("fontSizeInput");
    const aiDetailLevel = document.getElementById("aiDetailLevel");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const zoomLevelSpan = document.getElementById("zoomLevel");
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    const resetAllBtn = document.getElementById("resetAllBtn");

    // --- 2. ÉTAT DE L'APPLICATION ---
    let currentStep = "plan"; 
    const stepsOrder = ["plan", "intro", "dev", "conclu"];
    let content = { plan: "", intro: "", dev: {}, conclu: "" };
    let isLocked = { plan: false, intro: false, dev: false, conclu: false };
    let reachedStepIndex = 0;
    let currentZoom = 0.6; 
    let editorPreviewTimer = null;
    let lastSyncedPlan = ""; 
    let historyStack = []; 
    let redoStack = [];

    // --- 3. HISTORIQUE & SAUVEGARDE ---
    function saveToHistory() {
        if (historyStack.length > 25) historyStack.shift();
        historyStack.push(JSON.parse(JSON.stringify(content)));
        redoStack = [];
        updateHistoryButtons();
    }

    function undo() {
        if (historyStack.length > 0) {
            redoStack.push(JSON.parse(JSON.stringify(content)));
            content = historyStack.pop();
            refreshUIFromData();
            showNotification("Action annulée ↩️");
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            historyStack.push(JSON.parse(JSON.stringify(content)));
            content = redoStack.pop();
            refreshUIFromData();
            showNotification("Action rétablie ↪️");
        }
    }

    function updateHistoryButtons() {
        if(undoBtn && redoBtn) {
            undoBtn.disabled = historyStack.length === 0;
            redoBtn.disabled = redoStack.length === 0;
        }
    }

    function saveData() {
        const snapshot = {
            content, isLocked, reachedStepIndex,
            theme: themeInput.value,
            studentClass: studentClassInput.value,
            autoFormat: autoFormatCheckbox.checked,
            settings: { font: fontSelect.value, fontSize: fontSizeInput.value, aiLevel: aiDetailLevel.value },
            currentStep, lastUpdate: Date.now()
        };
        localStorage.setItem("buroMaster_premium_save", JSON.stringify(snapshot));
    }

    function loadData() {
        try {
            const saved = localStorage.getItem("buroMaster_premium_save");
            if (saved) {
                const data = JSON.parse(saved);
                if (Date.now() - (data.lastUpdate || 0) > 43200000) return "plan"; // 12h
                content = data.content || content;
                isLocked = data.isLocked || isLocked;
                reachedStepIndex = data.reachedStepIndex || 0;
                if (themeInput) themeInput.value = data.theme || "";
                if (studentClassInput) studentClassInput.value = data.studentClass || "";
                if (data.settings) {
                    fontSelect.value = data.settings.font;
                    fontSizeInput.value = data.settings.fontSize;
                    aiDetailLevel.value = data.settings.aiLevel;
                }
                return data.currentStep || "plan";
            }
        } catch (e) { console.error(e); }
        return "plan";
    }

    // --- 4. NAVIGATION & UI ---
    function goToStep(step) {
        clearTimeout(editorPreviewTimer);
        currentStep = step;
        
        const stepNames = { plan: "Plan", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
        stepTitle.textContent = "Édition : " + stepNames[step];
        
        const locked = isLocked[step];

        // Visibilité des contrôles
        generateBtn.style.display = (!locked && step !== "dev") ? "block" : "none";
        document.getElementById("dev-blocks-container").style.display = (step === "dev") ? "block" : "none";

        if (step === "dev") setupDevBlocks();

        updateHeaderUI();
        updatePreview();
        saveData();

        // SCROLL VERS LA PAGE ACTIVE
        setTimeout(() => {
            const activePage = document.querySelector(".page-wrapper");
            if(activePage) activePage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }

    function updateHeaderUI() {
        document.querySelectorAll(".step-link").forEach((link, index) => {
            const stepName = stepsOrder[index];
            link.classList.toggle("active", stepName === currentStep);
            link.classList.toggle("unlocked", index <= reachedStepIndex);
            const icon = isLocked[stepName] ? '<i class="fas fa-lock"></i> ' : '';
            link.innerHTML = icon + stepName.charAt(0).toUpperCase() + stepName.slice(1);
        });
    }

    // --- 5. MOTEUR DE RENDU (L'ANCIEN COEUR ROBUSTE) ---
    function updatePreview() {
        if (!pagesContainer) return;
        pagesContainer.innerHTML = ""; 
        let pageNum = 1;

        const renderFlow = (title, text, isEditable) => {
            let currentPageObj = createNewPage(pageNum, pagesContainer, isEditable);
            renderSection(title, text, currentPageObj.content, () => { 
                pageNum++; 
                currentPageObj = createNewPage(pageNum, pagesContainer, isEditable);
                return currentPageObj.content;
            });
            pageNum++;
        };

        if (currentStep === "plan") renderFlow("SOMMAIRE", content.plan, !isLocked.plan);
        else if (currentStep === "intro") renderFlow("INTRODUCTION", content.intro, !isLocked.intro);
        else if (currentStep === "conclu") renderFlow("CONCLUSION", content.conclu, !isLocked.conclu);
        else if (currentStep === "dev") {
            let currentPageObj = createNewPage(pageNum, pagesContainer, false);
            renderSection("DÉVELOPPEMENT", "", currentPageObj.content, () => {
                pageNum++; currentPageObj = createNewPage(pageNum, pagesContainer, false); return currentPageObj.content;
            });
            const sections = parsePlanForDev(content.plan || "");
            sections.forEach(s => {
                renderSection(s.title, content.dev[s.title], currentPageObj.content, () => {
                    pageNum++; currentPageObj = createNewPage(pageNum, pagesContainer, false); return currentPageObj.content;
                });
            });
        }
        updateZoomUI();
    }

    function renderSection(title, text, pageElement, onBreak) {
        const limitHeight = 910;
        if (title) {
            const t = document.createElement("div");
            t.className = "page-header";
            t.style.fontFamily = fontSelect.value;
            t.textContent = title.toUpperCase();
            pageElement.appendChild(t);
        }
        if (!text) return pageElement;

        const paragraphs = text.split("\n");
        paragraphs.forEach(para => {
            let div = document.createElement("div");
            div.style.fontFamily = fontSelect.value;
            div.style.fontSize = fontSizeInput.value + "px";
            div.className = "text-style";
            pageElement.appendChild(div);

            const words = para.split(" ");
            words.forEach(word => {
                const prev = div.textContent;
                div.textContent += (div.textContent ? " " : "") + word;
                if (pageElement.scrollHeight > limitHeight) {
                    div.textContent = prev;
                    pageElement = onBreak();
                    div = document.createElement("div");
                    div.className = "text-style";
                    div.style.fontFamily = fontSelect.value;
                    div.style.fontSize = fontSizeInput.value + "px";
                    div.textContent = word;
                    pageElement.appendChild(div);
                    
                    // AUTO-SCROLL SUR SAUT DE PAGE
                    pageElement.closest('.page-wrapper').scrollIntoView({ behavior: 'smooth' });
                    pageElement.closest('.page-wrapper').style.border = "2px solid var(--brand)";
                    setTimeout(() => pageElement.closest('.page-wrapper').style.border = "none", 1000);
                }
            });
        });
        return pageElement;
    }

    function createNewPage(num, container, isEditable) {
        const wrapper = document.createElement("div");
        wrapper.className = "page-wrapper";
        wrapper.innerHTML = `
            <div class="preview-sheet">
                <div class="page-content" ${isEditable ? 'contenteditable="true"' : ''}></div>
                <div class="page-footer">BuroMaster | Page ${num}</div>
            </div>`;
        
        const contentArea = wrapper.querySelector(".page-content");
        if(isEditable) {
            contentArea.addEventListener("input", () => {
                content[currentStep] = contentArea.innerText;
                clearTimeout(editorPreviewTimer);
                editorPreviewTimer = setTimeout(() => {
                    if (contentArea.scrollHeight > 920) updatePreview();
                    saveData();
                }, 1000);
            });
        }
        container.appendChild(wrapper);
        return { wrapper, content: contentArea };
    }

    // --- 6. PARSER & BLOCS DÉVELOPPEMENT ---
    function parsePlanForDev(planText) {
        const sections = [];
        const lines = planText.split('\n');
        let currentSection = null;
        const sectionRegex = /^([IVX]+|[0-9]+)\s*[\.\-\)]\s+/;
        lines.forEach(line => {
            if (sectionRegex.test(line.trim())) {
                currentSection = { title: line.trim(), subparts: [] };
                sections.push(currentSection);
            }
        });
        return sections;
    }

    function setupDevBlocks() {
        const container = document.getElementById("dev-blocks-container");
        container.innerHTML = "";
        const sections = parsePlanForDev(content.plan || "");
        
        sections.forEach(s => {
            const block = document.createElement("div");
            block.className = "dev-block";
            block.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <strong style="color:var(--brand)">${s.title}</strong>
                    <button class="generate-sub-btn"><i class="fas fa-robot"></i> IA</button>
                </div>
                <textarea class="sub-editor">${content.dev[s.title] || ""}</textarea>`;
            container.appendChild(block);
            
            const txt = block.querySelector("textarea");
            txt.addEventListener("input", () => {
                content.dev[s.title] = txt.value;
                updatePreview();
            });
            block.querySelector("button").onclick = () => handleSubGeneration(s.title, txt);
        });
    }

    // --- 7. IA & API ---
    async function handleSubGeneration(title, textarea) {
        saveToHistory();
        textarea.value = "⏳ Rédaction en cours...";
        const prompt = `Développe la partie "${title}" pour l'exposé "${themeInput.value}". Niveau: ${studentClassInput.value}.`;
        const res = await callAiAPI(prompt);
        if(res) {
            textarea.value = res;
            content.dev[title] = res;
            updatePreview();
            saveData();
        }
    }

    async function callAiAPI(prompt) {
        try {
            // METTRE TON URL VERCEL ICI
            const response = await fetch("https://ton-projet-vercel.vercel.app", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });
            const data = await response.json();
            return data.text || null;
        } catch (e) { return null; }
    }

    // --- 8. EXPORTS & ZOOM ---
    function updateZoomUI() {
        const wrappers = document.querySelectorAll(".page-wrapper");
        const sheets = document.querySelectorAll(".preview-sheet");
        wrappers.forEach(w => {
            w.style.width = `${210 * currentZoom}mm`;
            w.style.height = `${297 * currentZoom + 10}mm`;
        });
        sheets.forEach(s => s.style.transform = `scale(${currentZoom})`);
        zoomLevelSpan.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    downloadBtn.onclick = () => {
        const sheets = document.querySelectorAll(".preview-sheet");
        const worker = document.createElement("div");
        sheets.forEach(s => {
            const clone = s.cloneNode(true);
            clone.style.transform = "none";
            worker.appendChild(clone);
        });
        html2pdf().set({ margin: 0, filename: 'Expose.pdf', jsPDF: { unit: 'mm', format: 'a4' } }).from(worker).save();
    };

    // --- 9. INITIALISATION ---
    validateBtn.onclick = () => {
        isLocked[currentStep] = !isLocked[currentStep];
        if(isLocked[currentStep]) reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
        goToStep(currentStep);
    };

    resetAllBtn.onclick = () => { if(confirm("Tout effacer ?")) { localStorage.clear(); location.reload(); } };
    zoomInBtn.onclick = () => { if(currentZoom < 1.3) { currentZoom += 0.1; updateZoomUI(); } };
    zoomOutBtn.onclick = () => { if(currentZoom > 0.4) { currentZoom -= 0.1; updateZoomUI(); } };

    const start = loadData();
    refreshUIFromData();
    goToStep(start);
    
    function showNotification(msg) {
        const t = document.createElement("div");
        t.className = "toast-notification";
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    function refreshUIFromData() {
        updateHeaderUI();
        updatePreview();
    }
});
