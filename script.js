// ==========================================
// PORTION 1 : CONFIGURATION ET SAUVEGARDE
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    // Sélection des éléments du DOM
    const editor = document.getElementById("editor");
    const devContainer = document.getElementById("dev-blocks-container");
    const themeInput = document.getElementById("theme");
    const pagesContainer = document.getElementById("preview-pages");
    const stepTitle = document.getElementById("step-title");
    const validateBtn = document.getElementById("validateBtn");
    const nextStepBtn = document.getElementById("nextStepBtn");
    const generateBtn = document.getElementById("generateBtn");
    const downloadBtn = document.getElementById("downloadPdf");

    // État de l'application (Variables globales)
    let currentStep = "plan"; 
    const stepsOrder = ["plan", "intro", "dev", "conclu"];
    let content = { plan: "", intro: "", dev: {}, conclu: "" };
    let isLocked = { plan: false, intro: false, dev: false, conclu: false };
    let reachedStepIndex = 0;

    // --- FONCTION DE SAUVEGARDE ---
    function saveData() {
        try {
            const snapshot = {
                content,
                isLocked,
                reachedStepIndex,
                theme: themeInput ? themeInput.value : "",
                currentStep
            };
            localStorage.setItem("buroMaster_save_2026", JSON.stringify(snapshot));
        } catch (e) {
            console.warn("Impossible de sauvegarder dans le localStorage :", e);
        }
    }

    // --- FONCTION DE CHARGEMENT ---
    function loadData() {
        try {
            const saved = localStorage.getItem("buroMaster_save_2026");
            if (saved) {
                const data = JSON.parse(saved);
                
                content = data.content || { plan: "", intro: "", dev: {}, conclu: "" };
                isLocked = data.isLocked || { plan: false, intro: false, dev: false, conclu: false };
                reachedStepIndex = data.reachedStepIndex || 0;
                
                if (themeInput) {
                    themeInput.value = data.theme || "";
                }
                return data.currentStep || "plan";
            }
        } catch (e) {
            console.error("Erreur lors du chargement des données :", e);
        }
        return "plan";
    }

// ==========================================
// PORTION 2 : NAVIGATION ET UI DYNAMIQUE
// ==========================================

    // --- MISE À JOUR VISUELLE DU HEADER ---
    function updateHeaderUI() {
        document.querySelectorAll(".step-link").forEach((link, index) => {
            if (stepsOrder[index] === currentStep) {
                link.style.color = "#4CAF50"; 
                link.style.borderBottom = "2px solid #4CAF50";
            } else {
                link.style.borderBottom = "none";
                link.style.color = index <= reachedStepIndex ? "#333" : "#ccc";
            }
        });
    }

    // --- GESTION DU VERROUILLAGE DES INPUTS ---
    function toggleInputs(lock) {
        if (currentStep === "dev") {
            document.querySelectorAll(".sub-editor").forEach(ed => ed.readOnly = lock);
            document.querySelectorAll(".generate-sub-btn").forEach(btn => {
                btn.style.display = lock ? "none" : "block";
            });
        } else {
            if (editor) editor.readOnly = lock;
        }
        if (themeInput) {
            themeInput.disabled = isLocked[currentStep]; 
        }
    }

    // --- NAVIGATION ENTRE LES ÉTAPES ---
    function goToStep(step) {
        if (currentStep !== "dev" && editor) {
            content[currentStep] = editor.value;
        }

        currentStep = step;

        if (stepTitle) {
            const stepNames = { plan: "Plan", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
            stepTitle.textContent = "Édition : " + (stepNames[step] || step.toUpperCase());
        }
        
        const locked = isLocked[step];

        if (validateBtn) {
            validateBtn.textContent = locked ? "Modifier cette étape" : "Valider cette étape";
            validateBtn.style.background = locked ? "#ff9800" : "#4CAF50";
        }

        // TRANSFORMATION DU BOUTON SUIVANT (Logique demandée)
        if (nextStepBtn) {
            const isLastStep = (step === "conclu");
            
            if (isLastStep && locked) {
                nextStepBtn.textContent = "Télécharger en Word (.doc)";
                nextStepBtn.style.display = "block";
                nextStepBtn.style.background = "#2b5797"; 
                nextStepBtn.classList.add("is-word-btn");
            } else {
                nextStepBtn.textContent = "Étape Suivante";
                nextStepBtn.style.background = ""; 
                nextStepBtn.classList.remove("is-word-btn");
                
                const isNotLast = stepsOrder.indexOf(step) < stepsOrder.length - 1;
                nextStepBtn.style.display = (locked && isNotLast) ? "block" : "none";
            }
        }

        if (generateBtn) {
            generateBtn.style.display = (!locked && step !== "dev") ? "block" : "none";
        }

        if (step === "dev") {
            if (editor) editor.style.display = "none";
            if (devContainer) {
                devContainer.style.display = "block";
                setupDevBlocks(); 
            }
        } else {
            if (editor) {
                editor.style.display = "block";
                editor.value = content[step] || "";
            }
            if (devContainer) devContainer.style.display = "none";
        }

        toggleInputs(locked);
        updateHeaderUI();
        if (typeof updatePreview === "function") updatePreview();
        saveData(); 
    }

    // --- ÉCOUTEURS DE NAVIGATION ---
    document.querySelectorAll(".step-link").forEach((link, index) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            if (index <= reachedStepIndex) goToStep(stepsOrder[index]);
        });
    });

// ==========================================
// PORTION 3 : VALIDATION ET BLOCS DEV
// ==========================================

    // --- GESTION DU BOUTON VALIDER ---
    if (validateBtn) {
        validateBtn.addEventListener("click", () => {
            const isCurrentlyLocked = isLocked[currentStep];
            
            if (!isCurrentlyLocked) {
                if (currentStep !== "dev" && editor) {
                    content[currentStep] = editor.value;
                }
                isLocked[currentStep] = true;
                reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
            } else {
                isLocked[currentStep] = false;
            }
            
            goToStep(currentStep);
        });
    }

    // --- ANALYSE DU PLAN (LOGIQUE INTERNE) ---
    function parsePlanForDev(planText) {
        const sections = [];
        const lines = planText.split('\n');
        let currentSection = null;

        lines.forEach(line => {
            const cleanLine = line.trim();
            // LIGNE CORRIGÉE ET COMPLÉTÉE
            if (!cleanLine || /intro/i.test(cleanLine) || /conclu/i.test(cleanLine)) return; 

            if (/^[IVX]+\./.test(cleanLine)) {
                currentSection = { title: cleanLine, subparts: [] };
                sections.push(currentSection);
            } 
            else if (/^[A-Z]\./.test(cleanLine) && currentSection) {
                currentSection.subparts.push(cleanLine);
            }
        });
        return sections;
    }

    // --- GÉNÉRATION DES BLOCS DE DÉVELOPPEMENT ---
    function setupDevBlocks() {
        if (!devContainer) return;
        devContainer.innerHTML = "";

        const sections = parsePlanForDev(content.plan || "");

        sections.forEach(section => {
            const block = document.createElement("div");
            block.className = "dev-block";
            block.style.marginBottom = "25px";
            
            block.dataset.sectionData = JSON.stringify(section);

            block.innerHTML = `
                <div class="block-header" style="margin-bottom:10px;">
                    <strong style="color: #2c3e50;">${section.title}</strong>
                    ${section.subparts.length ? `<div style="font-size:0.85em; color:#666; margin-top:4px;">${section.subparts.join(" | ")}</div>` : ""}
                    <button class="generate-sub-btn" style="margin-top:8px; background:#2196F3; color:white; border:none; padding:6px 12px; cursor:pointer; border-radius:4px; display: ${isLocked['dev'] ? 'none' : 'block'}">
                        Générer cette partie
                    </button>
                </div>
                <textarea class="sub-editor" placeholder="Développez cette partie ici..." style="width:100%; min-height:120px; padding:10px; border:1px solid #ddd; border-radius:4px;" ${isLocked['dev'] ? 'readonly' : ''}>${content.dev[section.title] || ""}</textarea>
            `;

            devContainer.appendChild(block);

            const textarea = block.querySelector(".sub-editor");
            const button = block.querySelector(".generate-sub-btn");

            textarea.addEventListener("input", (e) => {
                content.dev[section.title] = e.target.value;
                if (typeof updatePreview === "function") updatePreview();
                saveData();
            });

            button.addEventListener("click", () => {
                if (typeof handleSubGeneration === "function") {
                    handleSubGeneration(block, textarea, button);
                }
            });
        });
    }

// ==========================================
// PORTION 4 : APERÇU ET GESTION DES PAGES
// ==========================================

    function updatePreview() {
        if (!pagesContainer) return;
        
        const fragment = document.createDocumentFragment();
        pagesContainer.innerHTML = ""; 
        
        let pageNum = 1;
        let currentPage = createNewPage(pageNum, fragment);

        if (content.plan) {
            currentPage = renderSection("SOMMAIRE", content.plan, currentPage, () => { 
                pageNum++; 
                return createNewPage(pageNum, fragment);
            });
        }

        if (content.intro || currentStep === "intro") {
            if (currentPage.innerHTML !== "") {
                pageNum++; 
                currentPage = createNewPage(pageNum, fragment);
            }
            currentPage = renderSection("INTRODUCTION", content.intro, currentPage, () => { 
                pageNum++; return createNewPage(pageNum, fragment);
            });
        }

        const hasDev = Object.keys(content.dev).length > 0 || currentStep === "dev";
        if (hasDev) {
            pageNum++; 
            currentPage = createNewPage(pageNum, fragment);
            
            const devTitle = document.createElement("div");
            devTitle.className = "title-style";
            devTitle.style.textAlign = "center";
            devTitle.style.textDecoration = "underline";
            devTitle.style.fontWeight = "bold";
            devTitle.textContent = "DÉVELOPPEMENT";
            currentPage.appendChild(devTitle);

            for (let sectionTitle in content.dev) {
                currentPage = renderSection(sectionTitle, content.dev[sectionTitle], currentPage, () => { 
                    pageNum++; return createNewPage(pageNum, fragment);
                });
            }
        }

        if (content.conclu || currentStep === "conclu") {
            pageNum++; 
            currentPage = createNewPage(pageNum, fragment);
            currentPage = renderSection("CONCLUSION", content.conclu, currentPage, () => { 
                pageNum++; return createNewPage(pageNum, fragment);
            });
        }

        pagesContainer.appendChild(fragment);
    }

    function renderSection(title, text, pageElement, onBreak) {
        if (!text && !title) return pageElement;

        if (title) {
            const t = document.createElement("div");
            t.className = "title-style";
            t.style.marginTop = "15px";
            t.style.fontWeight = "bold";
            t.textContent = title.toUpperCase();
            pageElement.appendChild(t);
        }

        if (!text) return pageElement;

        const lines = text.split("\n");
        for (let line of lines) {
            const cleanLine = line.trim();
            const div = document.createElement("div");
            
            if (/^[IVX]+\./.test(cleanLine)) {
                div.className = "title-style"; 
            } else if (/^[A-Z]\./.test(cleanLine)) {
                div.className = "subtitle-style";
                div.style.paddingLeft = "15px";
            } else {
                div.className = "text-style";
                div.style.textAlign = "justify";
            }

            div.textContent = cleanLine === "" ? "\u00A0" : cleanLine;
            pageElement.appendChild(div);

            const sheet = pageElement.closest('.preview-sheet');
            if (sheet && sheet.scrollHeight > 880) { 
                pageElement.removeChild(div); 
                pageElement = onBreak(); 
                pageElement.appendChild(div); 
            }
        }
        return pageElement;
    }

    function createNewPage(num, container) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        const currentTheme = themeInput ? themeInput.value.trim() || "MON EXPOSÉ" : "MON EXPOSÉ";
        
        page.innerHTML = `
            <div class="page-header" style="font-size:10px; color:#999; border-bottom:1px solid #eee; margin-bottom:10px; text-transform: uppercase;">${currentTheme}</div>
            <div class="page-content"></div>
            <div class="page-footer" style="position:absolute; bottom:20px; right:40px; font-size:10px; color:#999;">Page ${num}</div>
        `;
        container.appendChild(page);
        return page.querySelector(".page-content");
    }

    if (editor) {
        editor.addEventListener("input", () => { 
            content[currentStep] = editor.value; 
            updatePreview(); 
            saveData(); 
        });
    }

    if (themeInput) {
        themeInput.addEventListener("input", () => {
            updatePreview();
            saveData();
        });
    }

// ==========================================
// PORTION 5 : INTELLIGENCE ARTIFICIELLE
// ==========================================

    if (generateBtn) {
        generateBtn.addEventListener("click", async () => {
            const theme = themeInput.value.trim();
            if (!theme) {
                alert("Veuillez d'abord entrer un thème pour l'exposé.");
                return;
            }

            let prompt = "";
            if (currentStep === "plan") {
                prompt = `Agis comme un expert en rédaction scolaire. Génère UNIQUEMENT un plan détaillé pour l'exposé : "${theme}".
                    CONSIGNES STRICTES :
                    1. Ne rédige aucun contenu pour l’Introduction ni la Conclusion.
                    2. Utilise exclusivement la hiérarchie : Introduction, I, II, III… et A, B, C, D.
                    3. Le texte doit être brut, sans phrases inutiles.
                    4. IMPORTANT : Respecte ce format :
                    Introduction
                    I. [Titre]
                    A. [Sous-partie]
                    B. [Sous-partie]
                    Conclusion`;
                   
            } else if (currentStep === "intro") {
                prompt = `Rédige une introduction scolaire claire pour un exposé sur : "${theme}".
                    CONSIGNES : Ton neutre, accroche, définition du sujet et annonce du plan. Plusieurs paragraphes. Pas de listes.`;
                
            } else if (currentStep === "conclu") {
                prompt = `Rédige une conclusion scolaire pour un exposé sur : "${theme}".
                    CONSIGNES : Récapitule les points clés, propose une réponse à la problématique et une ouverture simple. Pas de "nous avons vu".`;
            }
            
            const originalValue = editor.value;
            editor.value = "⏳ Génération en cours par l'IA... Veuillez patienter.";
            generateBtn.disabled = true;

            const result = await callAiAPI(prompt);
            
            editor.value = result;
            content[currentStep] = result;
            generateBtn.disabled = false;
            
            updatePreview();
            saveData();
        });
    }

    async function handleSubGeneration(block, textarea, button) {
        const theme = themeInput.value.trim();
        const sectionData = JSON.parse(block.dataset.sectionData);

        if (!theme) {
            alert("Veuillez entrer un thème avant de générer.");
            return;
        }

        const originalBtnText = button.textContent;
        // LIGNE CORRIGÉE ET COMPLÉTÉE
        button.textContent = "⏳..."; 
        button.disabled = true;
        // const originalAreaValue = textarea.value; // variable inutile
        textarea.value = "L'IA développe cette partie...";
       
        const prompt = `Agis comme un professeur. Développe uniquement la partie suivante d'un exposé sur "${theme}" :
            TITRE : ${sectionData.title}
            SOUS-PARTIES : ${sectionData.subparts.join(", ")}
            
            CONSIGNES :
            1. Développe chaque sous-partie de manière détaillée.
            2. N’écris pas les titres (I., II., A., B.) dans le corps du texte.
            3. Ton neutre et scolaire.`;
       
        const result = await callAiAPI(prompt);
        
        textarea.value = result;
        content.dev[sectionData.title] = result;
        
        button.textContent = originalBtnText;
        button.disabled = false;
        
        updatePreview();
        saveData();
    }

    async function callAiAPI(prompt) {
        try {
            const API_URL = "https://buromaster.vercel.app"; 

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erreur serveur");
            }
            
            const data = await response.json();
            return data.text || "L'IA n'a pas renvoyé de texte.";
        } catch (err) {
            console.error("Erreur API:", err);
            return "Désolé, une erreur est survenue lors de la génération : " + err.message;
        }
    }

// ==========================================
// PORTION 6 : EXPORTS ET CHARGEMENT FINAL
// ==========================================

    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const element = document.getElementById("preview-pages");
            if (!element || !element.innerHTML.trim()) {
                alert("L'exposé est vide. Veuillez rédiger du contenu avant d'exporter.");
                return;
            }

            const sheets = document.querySelectorAll(".preview-sheet");
            sheets.forEach(sheet => {
                sheet.dataset.oldTransform = sheet.style.transform;
                sheet.style.transform = "none"; 
                sheet.style.margin = "0";
            });

            const themeFileName = themeInput ? themeInput.value.replace(/[^a-z0-9]/gi, '_') : "Expose";
            
            const options = {
                margin: 0,
                filename: `Expose_${themeFileName}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: ["css", "after"], after: ".preview-sheet" }
            };

            html2pdf().set(options).from(element).save().then(() => {
                sheets.forEach(sheet => {
                    sheet.style.transform = sheet.dataset.oldTransform || "scale(1)";
                    sheet.style.margin = "20px auto";
                });
            }).catch(err => {
                console.error("Erreur PDF:", err);
                alert("Erreur lors de la création du PDF.");
            });
        });
    }

    if (nextStepBtn) {
        nextStepBtn.addEventListener("click", () => {
            if (nextStepBtn.classList.contains("is-word-btn")) {
                exportToWord();
            } else {
                const index = stepsOrder.indexOf(currentStep);
                if (index < stepsOrder.length - 1) {
                    goToStep(stepsOrder[index + 1]);
                }
            }
        });
    }

    function exportToWord() {
        const element = document.getElementById("preview-pages");
        if (!element || !element.innerHTML.trim()) return;

        const contentHtml = element.innerHTML;
        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head><meta charset="utf-8"></head>
                <body>${contentHtml}</body>
            </html>
        `;

        try {
            const converted = htmlDocx.asBlob(fullHtml);
            const link = document.createElement("a");
            const themeName = themeInput ? themeInput.value.replace(/[^a-z0-9]/gi, '_') : "BuroMaster";
            
            link.href = URL.createObjectURL(converted);
            link.download = `Expose_${themeName}.docx`;
            link.click();
        } catch (error) {
            console.error("Erreur Export Word:", error);
            alert("Vérifiez que la bibliothèque html-docx est bien chargée.");
        }
    }

    const lastStep = loadData(); 

    if (content.plan || content.intro || content.dev || content.conclu) {
        updatePreview();
    }

    goToStep(lastStep);

    console.log("🚀 Système BuroMaster 2026 prêt.");

}); // FERMETURE FINALE DU DOMContentLoaded
