document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const devContainer = document.getElementById("dev-blocks-container");
    const themeInput = document.getElementById("theme");
    const pagesContainer = document.getElementById("preview-pages");
    const stepTitle = document.getElementById("step-title");
    const validateBtn = document.getElementById("validateBtn");
    const nextStepBtn = document.getElementById("nextStepBtn");
    const generateBtn = document.getElementById("generateBtn");
    const downloadBtn = document.getElementById("downloadPdf");

    let currentStep = "plan"; 
    const stepsOrder = ["plan", "intro", "dev", "conclu"];
    let content = { plan: "", intro: "", dev: {}, conclu: "" };
    let isLocked = { plan: false, intro: false, dev: false, conclu: false };
    let reachedStepIndex = 0;

    // --- 1. NAVIGATION DU HEADER ---
    document.querySelectorAll(".step-link").forEach((link, index) => {
        link.addEventListener("click", () => {
            if (index <= reachedStepIndex) goToStep(stepsOrder[index]);
        });
    });

    function updateHeaderUI() {
        document.querySelectorAll(".step-link").forEach((link, index) => {
            link.classList.remove("active", "unlocked");
            if (stepsOrder[index] === currentStep) link.classList.add("active");
            else if (index <= reachedStepIndex) link.classList.add("unlocked");
        });
    }

    // --- 2. LOGIQUE VALIDATION / MODIFICATION ---
    validateBtn.addEventListener("click", () => {
        if (!isLocked[currentStep]) {
            // ACTION : VALIDER
            isLocked[currentStep] = true;
            reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
            
            validateBtn.textContent = "Modifier cette étape";
            validateBtn.style.background = "#ff9800";
            nextStepBtn.style.display = "block";
            generateBtn.style.display = "none";
            
            toggleInputs(true);
        } else {
            // ACTION : MODIFIER
            isLocked[currentStep] = false;
            validateBtn.textContent = "Valider cette étape";
            validateBtn.style.background = "#4CAF50";
            nextStepBtn.style.display = "none";
            if(currentStep !== "dev") generateBtn.style.display = "block";
            
            toggleInputs(false);
        }
        updateHeaderUI();
    });

    function toggleInputs(lock) {
        if (currentStep === "dev") {
            document.querySelectorAll(".sub-editor").forEach(ed => ed.readOnly = lock);
            document.querySelectorAll(".generate-sub-btn").forEach(btn => btn.style.display = lock ? "none" : "block");
        } else {
            editor.readOnly = lock;
        }
    }

    nextStepBtn.addEventListener("click", () => {
        const index = stepsOrder.indexOf(currentStep);
        if (index < stepsOrder.length - 1) goToStep(stepsOrder[index + 1]);
    });

    function goToStep(step) {
        currentStep = step;
        stepTitle.textContent = "Édition : " + step.toUpperCase();
        
        // Configuration Boutons
        if (isLocked[step]) {
            validateBtn.textContent = "Modifier cette étape";
            validateBtn.style.background = "#ff9800";
            nextStepBtn.style.display = "block";
            generateBtn.style.display = "none";
        } else {
            validateBtn.textContent = "Valider cette étape";
            validateBtn.style.background = "#4CAF50";
            nextStepBtn.style.display = "none";
            generateBtn.style.display = (step === "dev") ? "none" : "block";
        }

        // Configuration Éditeurs
        if (step === "dev") {
            editor.style.display = "none";
            devContainer.style.display = "block";
            setupDevBlocks();
        } else {
            editor.style.display = "block";
            devContainer.style.display = "none";
            editor.value = content[step] || "";
            editor.readOnly = isLocked[step];
        }
        updateHeaderUI();
        updatePreview();
    }

    // --- 3. DÉVELOPPEMENT PAR BLOCS ---
    function setupDevBlocks() {
        devContainer.innerHTML = "";
        const lines = content.plan.split("\n");
        lines.forEach(line => {
            if (/^[IVX]+\./.test(line.trim()) && !line.toLowerCase().includes("intro") && !line.toLowerCase().includes("conclu")) {
                const block = document.createElement("div");
                block.className = "dev-block";
                block.innerHTML = `
                    <div class="block-header">
                        <strong>${line}</strong>
                        <button class="generate-sub-btn" style="${isLocked['dev'] ? 'display:none' : ''}">Générer</button>
                    </div>
                    <textarea class="sub-editor" ${isLocked['dev'] ? 'readonly' : ''}>${content.dev[line] || ""}</textarea>
                `;
                devContainer.appendChild(block);
                const subEd = block.querySelector(".sub-editor");
                subEd.addEventListener("input", (e) => {
                    content.dev[line] = e.target.value;
                    updatePreview();
                });
            }
        });
    }

    // --- 4. APERÇU ET PDF ---
    function updatePreview() {
        pagesContainer.innerHTML = "";
        let pageNum = 1;
        let currentPage = createNewPage(pageNum);

        renderSection("PLAN", content.plan, currentPage, () => { pageNum++; return createNewPage(pageNum); });

        if (content.intro || currentStep === "intro") {
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("INTRODUCTION", content.intro, currentPage, () => { pageNum++; return createNewPage(pageNum); });
        }

        if (Object.keys(content.dev).length > 0 || currentStep === "dev") {
            pageNum++; currentPage = createNewPage(pageNum);
            const t = document.createElement("div"); t.className = "title-style"; t.textContent = "DÉVELOPPEMENT";
            currentPage.appendChild(t);
            for (let s in content.dev) {
                renderSection(s, content.dev[s], currentPage, () => { pageNum++; return createNewPage(pageNum); });
            }
        }

        if (content.conclu || currentStep === "conclu") {
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("CONCLUSION", content.conclu, currentPage, () => { pageNum++; return createNewPage(pageNum); });
        }
    }

    function renderSection(title, text, pageElement, onBreak) {
        if (!text) return;
        text.split("\n").forEach(line => {
            const div = document.createElement("div");
            div.textContent = line.trim() === "" ? "\u00A0" : line;
            div.className = /^[IVX]+\./.test(line.trim()) ? "title-style" : (/^[A-Z]\./.test(line.trim()) ? "subtitle-style" : "text-style");
            pageElement.appendChild(div);
            if (pageElement.scrollHeight > 850) { 
                pageElement.removeChild(div); 
                pageElement = onBreak(); 
                pageElement.appendChild(div); 
            }
        });
    }

    function createNewPage(num) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        page.innerHTML = `<div class="page-header">${themeInput.value.toUpperCase() || "MON EXPOSÉ"}</div><div class="page-content"></div><div class="page-footer">Page ${num}</div>`;
        pagesContainer.appendChild(page);
        return page.querySelector(".page-content");
    }

    downloadBtn.addEventListener("click", () => {
    const element = document.getElementById("preview-pages");

    // Sauvegarde des styles actuels
    const sheets = document.querySelectorAll(".preview-sheet");
    sheets.forEach(sheet => {
        sheet.dataset.oldTransform = sheet.style.transform;
        sheet.dataset.oldMargin = sheet.style.margin;
        sheet.style.transform = "none";
        sheet.style.margin = "0";
    });

    const opt = {
        margin: 0,
        filename: `Expose_${themeInput.value || "BuroMaster"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "after"], after: ".preview-sheet" }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        // Restauration des styles après export
        sheets.forEach(sheet => {
            sheet.style.transform = sheet.dataset.oldTransform;
            sheet.style.margin = sheet.dataset.oldMargin;
        });
    });
});

    editor.addEventListener("input", () => { content[currentStep] = editor.value; updatePreview(); });
    themeInput.addEventListener("input", updatePreview);
    updatePreview();
});
