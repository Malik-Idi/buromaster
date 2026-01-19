// ==========================================
// PORTION 1 : INITIALISATION ET NAVIGATION
// ==========================================
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

    // --- MISE À JOUR VISUELLE DU HEADER ---
    function updateHeaderUI() {
        document.querySelectorAll(".step-link").forEach((link, index) => {
            // On ajoute la classe "active" à l'étape actuelle
            if (stepsOrder[index] === currentStep) {
                link.classList.add("active");
                link.style.fontWeight = "bold";
                link.style.color = "#4CAF50";
            } else {
                link.classList.remove("active");
                link.style.fontWeight = "normal";
                link.style.color = index <= reachedStepIndex ? "#333" : "#ccc";
            }
        });
    }

    // --- NAVIGATION ---
    document.querySelectorAll(".step-link").forEach((link, index) => {
        link.addEventListener("click", () => {
            if (index <= reachedStepIndex) goToStep(stepsOrder[index]);
        });
    });

    nextStepBtn.addEventListener("click", () => {
        const index = stepsOrder.indexOf(currentStep);
        if (index < stepsOrder.length - 1) goToStep(stepsOrder[index + 1]);
    });

       // --- VERROUILLAGE DYNAMIQUE DES INPUTS ---
    function toggleInputs(lock) {
        // 1. Gestion des éditeurs (Dev ou Classique)
        if (currentStep === "dev") {
            document.querySelectorAll(".sub-editor").forEach(ed => ed.readOnly = lock);
            document.querySelectorAll(".generate-sub-btn").forEach(btn => btn.style.display = lock ? "none" : "block");
        } else {
            if (editor) editor.readOnly = lock;
        }

        // 2. CORRECTION DU THÈME : 
        // Le thème ne doit être verrouillé QUE si l'étape actuelle est verrouillée.
        // On permet la modification du thème si on revient sur une étape non verrouillée.
        if (themeInput) {
            themeInput.disabled = isLocked[currentStep]; 
        }
    }

    // (La suite des fonctions goToStep et Validation sera dans la Portion 2)

   // =========================================================
// PORTION 2 : LOGIQUE DES ÉTAPES ET DÉVELOPPEMENT PAR BLOCS
// =========================================================

    function goToStep(step) {
        // Sauvegarder le contenu actuel avant de changer (si on n'est pas en mode dev)
        if (currentStep !== "dev" && editor) {
            content[currentStep] = editor.value;
        }

        currentStep = step;
        if (stepTitle) stepTitle.textContent = "Édition : " + step.toUpperCase();
        
        // Configuration Visuelle des Boutons
        if (isLocked[step]) {
            validateBtn.textContent = "Modifier cette étape";
            validateBtn.style.background = "#ff9800";
            if (nextStepBtn) nextStepBtn.style.display = "block";
            if (generateBtn) generateBtn.style.display = "none";
        } else {
            validateBtn.textContent = "Valider cette étape";
            validateBtn.style.background = "#4CAF50";
            if (nextStepBtn) nextStepBtn.style.display = "none";
            // On affiche le bouton générer principal sauf pour l'étape "dev"
            if (generateBtn) generateBtn.style.display = (step === "dev") ? "none" : "block";
        }

        // Configuration des Éditeurs
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
                editor.readOnly = isLocked[step];
            }
            if (devContainer) devContainer.style.display = "none";
        }
        updateHeaderUI();
        updatePreview();
    }

    // --- GESTION DU BOUTON VALIDER ---
    validateBtn.addEventListener("click", () => {
        if (!isLocked[currentStep]) {
            // Sauvegarde finale avant verrouillage
            if (currentStep !== "dev") content[currentStep] = editor.value;
            
            isLocked[currentStep] = true;
            reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
            
            validateBtn.textContent = "Modifier cette étape";
            validateBtn.style.background = "#ff9800";
            nextStepBtn.style.display = "block";
            generateBtn.style.display = "none";
            
            toggleInputs(true);
        } else {
            isLocked[currentStep] = false;
            validateBtn.textContent = "Valider cette étape";
            validateBtn.style.background = "#4CAF50";
            nextStepBtn.style.display = "none";
            if(currentStep !== "dev") generateBtn.style.display = "block";
            
            toggleInputs(false);
        }
        updateHeaderUI();
    });

    // --- GÉNÉRATION DES BLOCS DE DÉVELOPPEMENT ---
    function setupDevBlocks() {
        if (!devContainer) return;
        devContainer.innerHTML = "";
        
        // On récupère les lignes du plan pour créer les sections
        const lines = (content.plan || "").split("\n");
        lines.forEach(line => {
            const cleanLine = line.trim();
            // Détection des titres (ex: I. Titre) excluant Intro/Conclu
            if (/^[IVX]+\./.test(cleanLine) && 
                !cleanLine.toLowerCase().includes("intro") && 
                !cleanLine.toLowerCase().includes("conclu")) {
                
                const block = document.createElement("div");
                block.className = "dev-block";
                block.style.marginBottom = "20px";
                block.innerHTML = `
                    <div class="block-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong>${cleanLine}</strong>
                        <button class="generate-sub-btn" data-section="${cleanLine}" 
                                style="background:#2196F3; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; ${isLocked['dev'] ? 'display:none' : ''}">
                            Générer cette partie
                        </button>
                    </div>
                    <textarea class="sub-editor" style="width:100%; min-height:100px;" ${isLocked['dev'] ? 'readonly' : ''}>${content.dev[cleanLine] || ""}</textarea>
                `;
                devContainer.appendChild(block);

                const subEd = block.querySelector(".sub-editor");
                const subGenBtn = block.querySelector(".generate-sub-btn");

                // Sauvegarde en temps réel du sous-bloc
                subEd.addEventListener("input", (e) => {
                    content.dev[cleanLine] = e.target.value;
                    updatePreview();
                });

                // Événement pour générer chaque partie (sera lié à l'IA dans la portion 4)
                subGenBtn.addEventListener("click", async () => {
                    await handleSubGeneration(cleanLine, subEd, subGenBtn);
                });
            }
        });
    }

    // =========================================================
// PORTION 3 : APERÇU, PAGINATION ET MISE EN PAGE
// =========================================================

    // --- MISE À JOUR DE L'APERÇU ---
    function updatePreview() {
        if (!pagesContainer) return;
        pagesContainer.innerHTML = "";
        let pageNum = 1;
        let currentPage = createNewPage(pageNum);

        // 1. Rendu du PLAN
        if (content.plan) {
            renderSection("SOMMAIRE", content.plan, currentPage, () => { 
                pageNum++; 
                currentPage = createNewPage(pageNum);
                return currentPage;
            });
        }

        // 2. Rendu de l'INTRODUCTION
        if (content.intro || currentStep === "intro") {
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("INTRODUCTION", content.intro, currentPage, () => { 
                pageNum++; 
                currentPage = createNewPage(pageNum);
                return currentPage;
            });
        }

        // 3. Rendu du DÉVELOPPEMENT
        if (Object.keys(content.dev).length > 0 || currentStep === "dev") {
            pageNum++; currentPage = createNewPage(pageNum);
            const t = document.createElement("div"); 
            t.className = "title-style"; 
            t.style.textAlign = "center";
            t.style.fontSize = "1.4em";
            t.style.marginBottom = "20px";
            t.textContent = "DÉVELOPPEMENT";
            currentPage.appendChild(t);

            for (let sectionTitle in content.dev) {
                renderSection(sectionTitle, content.dev[sectionTitle], currentPage, () => { 
                    pageNum++; 
                    currentPage = createNewPage(pageNum);
                    return currentPage;
                });
            }
        }

        // 4. Rendu de la CONCLUSION
        if (content.conclu || currentStep === "conclu") {
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("CONCLUSION", content.conclu, currentPage, () => { 
                pageNum++; 
                currentPage = createNewPage(pageNum);
                return currentPage;
            });
        }
    }

    // --- RENDU D'UNE SECTION AVEC SAUT DE PAGE AUTOMATIQUE ---
    function renderSection(title, text, pageElement, onBreak) {
        if (!text && !title) return;

        // Ajouter le titre de la section
        if (title) {
            const t = document.createElement("div");
            t.className = "title-style";
            t.style.color = "#2c3e50";
            t.style.marginTop = "15px";
            t.textContent = title.toUpperCase();
            pageElement.appendChild(t);
        }

        if (!text) return;

        // Traiter chaque ligne de texte
        const lines = text.split("\n");
        lines.forEach(line => {
            const cleanLine = line.trim();
            const div = document.createElement("div");
            
            // Gestion du style selon le format de la ligne
            if (/^[IVX]+\./.test(cleanLine)) {
                div.className = "title-style";
            } else if (/^[A-Z]\./.test(cleanLine)) {
                div.className = "subtitle-style";
                div.style.paddingLeft = "20px";
            } else {
                div.className = "text-style";
                div.style.textAlign = "justify";
                div.style.marginBottom = "8px";
            }

            div.textContent = cleanLine === "" ? "\u00A0" : cleanLine;
            pageElement.appendChild(div);

            // Détection du débordement (Hauteur max A4 simulée)
            if (pageElement.scrollHeight > 850) { 
                pageElement.removeChild(div); 
                pageElement = onBreak(); // Crée une nouvelle page
                pageElement.appendChild(div); 
            }
        });
    }

    // --- CRÉATION D'UNE PAGE BLANCHE ---
    function createNewPage(num) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        // Header et Footer
        const titleText = themeInput && themeInput.value ? themeInput.value.toUpperCase() : "MON EXPOSÉ";
        page.innerHTML = `
            <div class="page-header" style="border-bottom:1px solid #eee; margin-bottom:20px; font-size:12px; color:#888;">${titleText}</div>
            <div class="page-content" style="flex-grow:1;"></div>
            <div class="page-footer" style="border-top:1px solid #eee; margin-top:20px; text-align:right; font-size:12px; color:#888;">Page ${num}</div>
        `;
        pagesContainer.appendChild(page);
        return page.querySelector(".page-content");
    }

    // --- ÉCOUTEURS POUR LA MISE À JOUR ---
    if (editor) {
        editor.addEventListener("input", () => { 
            content[currentStep] = editor.value; 
            updatePreview(); 
        });
    }
    if (themeInput) {
        themeInput.addEventListener("input", updatePreview);
    }
// =========================================================
// PORTION 4 : GÉNÉRATION IA, EXPORT PDF ET CLÔTURE
// =========================================================

    // --- 1. GÉNÉRATION IA PRINCIPALE (PLAN / INTRO / CONCLU) ---
    if (generateBtn) {
        generateBtn.addEventListener("click", async () => {
            if (!themeInput.value.trim()) {
                alert("Veuillez d'abord entrer un thème.");
                return;
            }

            let prompt = "";
            if (currentStep === "plan") {
                prompt = `Génère un plan structuré d’exposé scolaire sur le thème : "${themeInput.value}". Utilise une structure avec I, II, III et A, B.`;
            } else if (currentStep === "intro") {
                prompt = `Rédige une introduction académique pour un exposé sur : "${themeInput.value}".`;
            } else if (currentStep === "conclu") {
                prompt = `Rédige une conclusion synthétique pour un exposé sur : "${themeInput.value}".`;
            }

            // UI State
            editor.value = "⏳ Génération en cours...";
            generateBtn.disabled = true;

            const result = await generateWithAI(prompt);
            
            editor.value = result;
            content[currentStep] = result;
            generateBtn.disabled = false;
            updatePreview();
        });
    }

    // --- 2. GÉNÉRATION IA POUR LES BLOCS DE DÉVELOPPEMENT ---
    async function handleSubGeneration(sectionTitle, textarea, button) {
        if (!themeInput.value.trim()) {
            alert("Veuillez entrer un thème.");
            return;
        }

        const originalText = button.textContent;
        button.textContent = "⏳...";
        button.disabled = true;
        textarea.value = "Génération du contenu en cours...";

        const prompt = `Développe de manière détaillée la partie suivante de mon exposé sur "${themeInput.value}" : "${sectionTitle}". Rédige un texte fluide et éducatif.`;
        
        const result = await generateWithAI(prompt);
        
        textarea.value = result;
        content.dev[sectionTitle] = result;
        button.textContent = originalText;
        button.disabled = false;
        updatePreview();
    }

    // --- 3. EXPORT PDF ---
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const element = document.getElementById("preview-pages");
            if (!element) return;

            // Préparation visuelle pour l'export
            const sheets = document.querySelectorAll(".preview-sheet");
            sheets.forEach(sheet => {
                sheet.dataset.oldTransform = sheet.style.transform;
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

            // Utilisation de la librairie html2pdf
            html2pdf().set(opt).from(element).save().then(() => {
                // Restauration du zoom à l'écran après export
                sheets.forEach(sheet => {
                    sheet.style.transform = sheet.dataset.oldTransform || "scale(1)";
                    sheet.style.margin = "20px auto";
                });
            });
        });
    }

    // --- 4. FONCTION APPEL API ---
    async function generateWithAI(prompt) {
        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) throw new Error("Erreur serveur");
            const data = await response.json();
            return data.text || "Erreur de réponse de l'IA.";
        } catch (err) {
            console.error("Erreur IA:", err);
            return "Désolé, impossible de contacter l’IA. Vérifiez votre connexion.";
        }
    }

    // Initialisation au chargement
    updatePreview();
    updateHeaderUI();
});
