document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const themeInput = document.getElementById("theme");
    const pagesContainer = document.getElementById("preview-pages");
    const stepTitle = document.getElementById("step-title");
    const generateBtn = document.getElementById("generateBtn");
    const validateBtn = document.getElementById("validateBtn");
    const nextStepBtn = document.getElementById("nextStepBtn");

    // Données de l'exposé
    let currentStep = "plan"; // plan ou intro
    let content = { plan: "", intro: "" };
    let isLocked = { plan: false, intro: false };

    // --- RENDU DE L'APERÇU ---
    function updatePreview() {
        pagesContainer.innerHTML = "";
        let pageNum = 1;
        let currentPage = createNewPage(pageNum);

        // Rendu du PLAN
        renderText(content.plan, currentPage, (p) => {
            pageNum++;
            currentPage = createNewPage(pageNum);
            return currentPage;
        });

        // SAUT DE PAGE FORCÉ POUR L'INTRO
        if (content.intro !== "" || currentStep === "intro") {
            pageNum++;
            currentPage = createNewPage(pageNum);
            const sectionTitle = document.createElement("div");
            sectionTitle.className = "title-style";
            sectionTitle.textContent = "INTRODUCTION";
            currentPage.appendChild(sectionTitle);

            renderText(content.intro, currentPage, (p) => {
                pageNum++;
                currentPage = createNewPage(pageNum);
                return currentPage;
            });
        }
    }

    function createNewPage(num) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        page.innerHTML = `
            <div class="page-header">EXPOSÉ : ${themeInput.value.toUpperCase() || "MON EXPOSÉ"}</div>
            <div class="page-content"></div>
            <div class="page-footer">Page ${num}</div>
        `;
        pagesContainer.appendChild(page);
        return page.querySelector(".page-content");
    }

    function renderText(text, pageElement, onPageBreak) {
        if (!text) return;
        const lines = text.split("\n");
        lines.forEach(line => {
            const div = document.createElement("div");
            div.textContent = line.trim() === "" ? "\u00A0" : line;
            if (/^[IVX]+\./.test(line.trim())) div.className = "title-style";
            else if (/^[A-Z]\./.test(line.trim())) div.className = "subtitle-style";
            else div.className = "text-style";
            
            pageElement.appendChild(div);
            if (pageElement.scrollHeight > 850) {
                pageElement.removeChild(div);
                pageElement = onPageBreak();
                pageElement.appendChild(div);
            }
        });
    }

    // --- ACTIONS ---
    editor.addEventListener("input", () => {
        content[currentStep] = editor.value;
        updatePreview();
    });

    validateBtn.addEventListener("click", () => {
        isLocked[currentStep] = !isLocked[currentStep];
        applyLockState();
    });

    function applyLockState() {
        const locked = isLocked[currentStep];
        editor.readOnly = locked;
        validateBtn.textContent = locked ? `Modifier l'étape` : `Valider cette étape`;
        validateBtn.style.background = locked ? "#ff9800" : "#4CAF50";
        nextStepBtn.style.display = locked && currentStep === "plan" ? "block" : "none";
        
        // Débloquer le lien du haut
        if (isLocked.plan) document.getElementById("link-intro").classList.add("unlocked");
    }

    nextStepBtn.addEventListener("click", () => {
        goToStep("intro");
    });

    // Navigation du haut
    document.getElementById("link-plan").addEventListener("click", () => goToStep("plan"));
    document.getElementById("link-intro").addEventListener("click", () => {
        if (isLocked.plan) goToStep("intro");
    });

    function goToStep(step) {
        currentStep = step;
        stepTitle.textContent = step === "plan" ? "Édition du Plan" : "Rédaction de l'Introduction";
        generateBtn.textContent = step === "plan" ? "Générer un plan" : "Générer une introduction";
        editor.value = content[step];
        
        document.querySelectorAll(".step-link").forEach(l => l.classList.remove("active"));
        document.getElementById(`link-${step}`).classList.add("active");
        
        applyLockState();
        updatePreview();
    }

    generateBtn.addEventListener("click", () => {
        if (currentStep === "plan") {
            editor.value = "I. INTRODUCTION\nA. Sujet\nII. DÉVELOPPEMENT\nA. Axe 1\nIII. CONCLUSION";
        } else {
            editor.value = "L'introduction de mon exposé sur " + themeInput.value + " se compose d'une accroche...";
        }
        content[currentStep] = editor.value;
        updatePreview();
    });

    document.getElementById("downloadPdf").addEventListener("click", () => {
        html2pdf().set({ margin: 0, filename: 'expose-complet.pdf', jsPDF: { unit: 'mm', format: 'a4' } })
                 .from(pagesContainer).save();
    });

    updatePreview();
});
