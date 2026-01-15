document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const devContainer = document.getElementById("dev-blocks-container");
    const themeInput = document.getElementById("theme");
    const pagesContainer = document.getElementById("preview-pages");
    const stepTitle = document.getElementById("step-title");
    const validateBtn = document.getElementById("validateBtn");
    const nextStepBtn = document.getElementById("nextStepBtn");
    const generateBtn = document.getElementById("generateBtn");

    let currentStep = "plan"; 
    const stepsOrder = ["plan", "intro", "dev", "conclu"];
    let content = { plan: "", intro: "", dev: {}, conclu: "" };
    let isLocked = { plan: false, intro: false, dev: false, conclu: false };
    let reachedStep = 0; // Index de l'étape maximale atteinte

    // --- 1. GESTION DE LA NAVIGATION (HEADER) ---
    document.querySelectorAll(".step-link").forEach((link, index) => {
        link.addEventListener("click", () => {
            if (index <= reachedStep) {
                goToStep(stepsOrder[index]);
            }
        });
    });

    function updateStepHeader() {
        document.querySelectorAll(".step-link").forEach((link, index) => {
            link.classList.remove("active", "unlocked");
            if (stepsOrder[index] === currentStep) link.classList.add("active");
            else if (index <= reachedStep) link.classList.add("unlocked");
        });
    }

    // --- 2. LOGIQUE DES BOUTONS DE VALIDATION ---
    validateBtn.addEventListener("click", () => {
        if (!isLocked[currentStep]) {
            // ACTION : VALIDER
            if (currentStep !== "dev" && editor.value.trim() === "") return alert("Le contenu est vide !");
            
            isLocked[currentStep] = true;
            reachedStep = Math.max(reachedStep, stepsOrder.indexOf(currentStep) + 1);
            
            validateBtn.textContent = "Modifier cette étape";
            validateBtn.style.background = "#ff9800"; // Orange pour modification
            nextStepBtn.style.display = "block";
            generateBtn.style.display = "none"; // On cache le bouton générer
            
            if(currentStep === "dev") {
                document.querySelectorAll(".sub-editor").forEach(ed => ed.readOnly = true);
                document.querySelectorAll(".generate-sub-btn").forEach(btn => btn.style.display = "none");
            } else {
                editor.readOnly = true;
            }
        } else {
            // ACTION : MODIFIER (Déverrouillage)
            isLocked[currentStep] = false;
            validateBtn.textContent = "Valider cette étape";
            validateBtn.style.background = "#4CAF50"; 
            nextStepBtn.style.display = "none";
            
            if(currentStep !== "dev") {
                generateBtn.style.display = "block";
                editor.readOnly = false;
            } else {
                document.querySelectorAll(".sub-editor").forEach(ed => ed.readOnly = false);
                document.querySelectorAll(".generate-sub-btn").forEach(btn => btn.style.display = "block");
            }
        }
        updateStepHeader();
    });

    nextStepBtn.addEventListener("click", () => {
        const index = stepsOrder.indexOf(currentStep);
        if (index < stepsOrder.length - 1) {
            goToStep(stepsOrder[index + 1]);
        }
    });

    function goToStep(step) {
        currentStep = step;
        stepTitle.textContent = "Édition : " + step.toUpperCase();
        
        // Reset l'état des boutons pour la nouvelle étape
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

        // Affichage des éditeurs
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

        updateStepHeader();
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

                const subEditor = block.querySelector(".sub-editor");
                subEditor.addEventListener("input", (e) => {
                    content.dev[line] = e.target.value;
                    updatePreview();
                });
            }
        });
    }

    // --- 4. RENDU (Simplifié pour rester court) ---
    function updatePreview() {
        pagesContainer.innerHTML = "";
        let pageNum = 1;
        let currentPage = createNewPage(pageNum);

        // Plan
        renderSection("PLAN", content.plan, currentPage, () => { pageNum++; return createNewPage(pageNum); });

        // Intro
        if (content.intro || currentStep === "intro") {
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("INTRODUCTION", content.intro, currentPage, () => { pageNum++; return createNewPage(pageNum); });
        }

        // Dev
        if (Object.keys(content.dev).length > 0 || currentStep === "dev") {
            pageNum++; currentPage = createNewPage(pageNum);
            const t = document.createElement("div"); t.className = "title-style"; t.textContent = "DÉVELOPPEMENT";
            currentPage.appendChild(t);
            for (let s in content.dev) {
                renderSection(s, content.dev[s], currentPage, () => { pageNum++; return createNewPage(pageNum); });
            }
        }

        // Conclu
        if (content.conclu || currentStep === "conclu") {
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("CONCLUSION", content.conclu, currentPage, () => { pageNum++; return createNewPage(pageNum); });
        }
    }

    function createNewPage(num) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        page.innerHTML = `<div class="page-header">${themeInput.value.toUpperCase() || "MON EXPOSÉ"}</div><div class="page-content"></div><div class="page-footer">Page ${num}</div>`;
        pagesContainer.appendChild(page);
        return page.querySelector(".page-content");
    }

    function renderSection(title, text, pageElement, onBreak) {
        if (!text) return;
        text.split("\n").forEach(line => {
            const div = document.createElement("div");
            div.textContent = line.trim() === "" ? "\u00A0" : line;
            div.className = /^[IVX]+\./.test(line.trim()) ? "title-style" : (/^[A-Z]\./.test(line.trim()) ? "subtitle-style" : "text-style");
            pageElement.appendChild(div);
            if (pageElement.scrollHeight > 850) { pageElement.removeChild(div); pageElement = onBreak(); pageElement.appendChild(div); }
        });
    }

    editor.addEventListener("input", () => { content[currentStep] = editor.value; updatePreview(); });
    themeInput.addEventListener("input", updatePreview);
    updatePreview();
});
