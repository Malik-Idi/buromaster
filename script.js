document.addEventListener("DOMContentLoaded", function () {
    // Éléments
    const editor = document.getElementById("editor");
    const devContainer = document.getElementById("dev-blocks-container");
    const themeInput = document.getElementById("theme");
    const pagesContainer = document.getElementById("preview-pages");
    const stepTitle = document.getElementById("step-title");
    const validateBtn = document.getElementById("validateBtn");
    const nextStepBtn = document.getElementById("nextStepBtn");
    const generateBtn = document.getElementById("generateBtn");

    // Données
    let currentStep = "plan"; 
    const stepsOrder = ["plan", "intro", "dev", "conclu"];
    let content = { plan: "", intro: "", dev: {}, conclu: "" };
    let isLocked = { plan: false, intro: false, dev: false, conclu: false };

    // --- 1. RENDU DE L'APERÇU ---
    function updatePreview() {
        pagesContainer.innerHTML = "";
        let pageNum = 1;
        let currentPage = createNewPage(pageNum);

        // Rendu Plan
        renderSection("PLAN", content.plan, currentPage, (p) => { pageNum++; return createNewPage(pageNum); });

        // Rendu Intro
        if (content.intro || currentStep === "intro") {
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("INTRODUCTION", content.intro, currentPage, (p) => { pageNum++; return createNewPage(pageNum); });
        }

        // Rendu Développement (Bloc par bloc)
        if (Object.keys(content.dev).length > 0 || currentStep === "dev") {
            pageNum++; currentPage = createNewPage(pageNum);
            const devTitle = document.createElement("div");
            devTitle.className = "title-style";
            devTitle.textContent = "DÉVELOPPEMENT";
            currentPage.appendChild(devTitle);

            for (let section in content.dev) {
                renderSection(section, content.dev[section], currentPage, (p) => { pageNum++; return createNewPage(pageNum); });
            }
        }

        // Rendu Conclusion
        if (content.conclu || currentStep === "conclu") {
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("CONCLUSION", content.conclu, currentPage, (p) => { pageNum++; return createNewPage(pageNum); });
        }
    }

    function renderSection(title, text, pageElement, onPageBreak) {
        if (!text && currentStep !== title.toLowerCase()) return;
        
        const lines = text ? text.split("\n") : [];
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

    function createNewPage(num) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        page.innerHTML = `
            <div class="page-header">${themeInput.value || "MON EXPOSÉ"}</div>
            <div class="page-content"></div>
            <div class="page-footer">Page ${num}</div>
        `;
        pagesContainer.appendChild(page);
        return page.querySelector(".page-content");
    }

    // --- 2. LOGIQUE DE NAVIGATION ET BLOCS ---
    function setupDevBlocks() {
        editor.style.display = "none";
        devContainer.style.display = "block";
        devContainer.innerHTML = "";

        const lines = content.plan.split("\n");
        lines.forEach(line => {
            // On prend les titres II, III, etc. (On ignore I et Conclusion)
            if (/^[IVX]+\./.test(line.trim()) && !line.toLowerCase().includes("intro") && !line.toLowerCase().includes("conclu")) {
                const block = document.createElement("div");
                block.className = "dev-block";
                block.innerHTML = `
                    <div class="block-header">
                        <strong>${line}</strong>
                        <button class="generate-sub-btn">Générer</button>
                    </div>
                    <textarea class="sub-editor" data-section="${line}">${content.dev[line] || ""}</textarea>
                `;
                devContainer.appendChild(block);

                block.querySelector(".sub-editor").addEventListener("input", (e) => {
                    content.dev[line] = e.target.value;
                    updatePreview();
                });
            }
        });
    }

    function goToStep(step) {
        currentStep = step;
        stepTitle.textContent = "Édition : " + step.toUpperCase();
        
        // Basculer l'affichage si c'est le développement
        if (step === "dev") {
            setupDevBlocks();
        } else {
            editor.style.display = "block";
            devContainer.style.display = "none";
            editor.value = content[step] || "";
        }

        document.querySelectorAll(".step-link").forEach(l => l.classList.remove("active"));
        document.getElementById(`link-${step}`).classList.add("active");
        
        nextStepBtn.style.display = "none";
        validateBtn.style.display = "block";
        updatePreview();
    }

    validateBtn.addEventListener("click", () => {
        isLocked[currentStep] = true;
        validateBtn.style.display = "none";
        nextStepBtn.style.display = "block";
        document.getElementById(`link-${currentStep}`).classList.add("unlocked");
    });

    nextStepBtn.addEventListener("click", () => {
        const index = stepsOrder.indexOf(currentStep);
        if (index < stepsOrder.length - 1) goToStep(stepsOrder[index + 1]);
    });

    themeInput.addEventListener("input", updatePreview);
    editor.addEventListener("input", () => {
        content[currentStep] = editor.value;
        updatePreview();
    });

    // Initialisation
    updatePreview();
});
