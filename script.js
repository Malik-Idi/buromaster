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
                
                // Restauration sécurisée des données
                content = data.content || { plan: "", intro: "", dev: {}, conclu: "" };
                isLocked = data.isLocked || { plan: false, intro: false, dev: false, conclu: false };
                reachedStepIndex = data.reachedStepIndex || 0;
                
                if (themeInput) {
                    themeInput.value = data.theme || "";
                }

                // Note : goToStep sera appelé à la toute fin du script global 
                // pour s'assurer que toutes les fonctions sont bien définies.
                return data.currentStep || "plan";
            }
        } catch (e) {
            console.error("Erreur lors du chargement des données :", e);
        }
        return "plan"; // Étape par défaut
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
        // 1. Sauvegarde du texte actuel (sauf en mode dev qui a sa propre logique)
        if (currentStep !== "dev" && editor) {
            content[currentStep] = editor.value;
        }

        currentStep = step;

        // 2. Mise à jour du titre de l'étape
        if (stepTitle) {
            const stepNames = { plan: "Plan", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
            stepTitle.textContent = "Édition : " + (stepNames[step] || step.toUpperCase());
        }
        
        const locked = isLocked[step];

        // 3. Gestion du bouton VALIDATION / MODIFICATION
        if (validateBtn) {
            validateBtn.textContent = locked ? "Modifier cette étape" : "Valider cette étape";
            validateBtn.style.background = locked ? "#ff9800" : "#4CAF50";
        }

        // 4. TRANSFORMATION DU BOUTON SUIVANT (Logique demandée)
        if (nextStepBtn) {
            const isLastStep = (step === "conclu");
            
            if (isLastStep && locked) {
                // Si conclusion verrouillée : devient bouton WORD
                nextStepBtn.textContent = "Télécharger en Word (.doc)";
                nextStepBtn.style.display = "block";
                nextStepBtn.style.background = "#2b5797"; // Bleu Word
                nextStepBtn.classList.add("is-word-btn");
            } else {
                // Sinon : bouton SUIVANT classique
                nextStepBtn.textContent = "Étape Suivante";
                nextStepBtn.style.background = ""; // Style CSS original
                nextStepBtn.classList.remove("is-word-btn");
                
                const isNotLast = stepsOrder.indexOf(step) < stepsOrder.length - 1;
                nextStepBtn.style.display = (locked && isNotLast) ? "block" : "none";
            }
        }

        // 5. Gestion du bouton GÉNÉRER
        if (generateBtn) {
            generateBtn.style.display = (!locked && step !== "dev") ? "block" : "none";
        }

        // 6. Basculement des éditeurs (Simple vs Blocs Dev)
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
                // ACTION : VALIDER
                if (currentStep !== "dev" && editor) {
                    content[currentStep] = editor.value;
                }
                isLocked[currentStep] = true;
                // Débloque l'étape suivante
                reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
            } else {
                // ACTION : MODIFIER
                isLocked[currentStep] = false;
            }
            
            // Rafraîchit l'interface pour appliquer les changements (boutons, readonly, etc.)
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
            // On ignore l'intro et la conclu qui ont leurs propres onglets
            if (!cleanLine || /intro/i.test(cleanLine) || /conclu/i.test(cleanLine)) return;

            // Détecte les titres principaux (I. Titre ou II. Titre)
            if (/^[IVX]+\./.test(cleanLine)) {
                currentSection = { title: cleanLine, subparts: [] };
                sections.push(currentSection);
            } 
            // Détecte les sous-parties (A. Sous-titre)
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
            
            // On stocke les données pour l'IA
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

            // Enregistrement en temps réel
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

    // --- MISE À JOUR DE LA PREVIEW ---
    function updatePreview() {
        if (!pagesContainer) return;
        
        // On utilise un fragment pour améliorer les performances de rendu
        const fragment = document.createDocumentFragment();
        pagesContainer.innerHTML = ""; 
        
        let pageNum = 1;
        let currentPage = createNewPage(pageNum, fragment);

        // 1. Rendu du SOMMAIRE (Plan)
        if (content.plan) {
            currentPage = renderSection("SOMMAIRE", content.plan, currentPage, () => { 
                pageNum++; 
                return createNewPage(pageNum, fragment);
            });
        }

        // 2. Rendu de l'INTRODUCTION
        if (content.intro || currentStep === "intro") {
            // Saut de page pour l'intro si la page actuelle n'est pas vide
            if (currentPage.innerHTML !== "") {
                pageNum++; 
                currentPage = createNewPage(pageNum, fragment);
            }
            currentPage = renderSection("INTRODUCTION", content.intro, currentPage, () => { 
                pageNum++; return createNewPage(pageNum, fragment);
            });
        }

        // 3. Rendu du DÉVELOPPEMENT
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

        // 4. Rendu de la CONCLUSION
        if (content.conclu || currentStep === "conclu") {
            pageNum++; 
            currentPage = createNewPage(pageNum, fragment);
            currentPage = renderSection("CONCLUSION", content.conclu, currentPage, () => { 
                pageNum++; return createNewPage(pageNum, fragment);
            });
        }

        pagesContainer.appendChild(fragment);
    }

    // --- FONCTION DE RENDU D'UN TEXTE SUR LES PAGES ---
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
            
            // Stylisation selon la hiérarchie du plan
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

            // GESTION DU SAUT DE PAGE (Détection sur la feuille parente)
            const sheet = pageElement.closest('.preview-sheet');
            if (sheet && sheet.scrollHeight > 880) { 
                pageElement.removeChild(div); 
                pageElement = onBreak(); 
                pageElement.appendChild(div); 
            }
        }
        return pageElement;
    }

    // --- CRÉATION PHYSIQUE D'UNE PAGE ---
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

    // --- ÉCOUTEURS D'ENTRÉE POUR MISE À JOUR ---
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

    // --- 1. GÉNÉRATION PRINCIPALE (PLAN / INTRO / CONCLUSION) ---
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
            
            // État de chargement
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

    // --- 2. GÉNÉRATION SPÉCIFIQUE POUR LES BLOCS DE DÉVELOPPEMENT ---
    async function handleSubGeneration(block, textarea, button) {
        const theme = themeInput.value.trim();
        const sectionData = JSON.parse(block.dataset.sectionData); // Correction : On récupère les données ici

        if (!theme) {
            alert("Veuillez entrer un thème avant de générer.");
            return;
        }

        const originalBtnText = button.textContent;
        button.textContent = "⏳...";
        button.disabled = true;
        const originalAreaValue = textarea.value;
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
        content.dev[sectionData.title] = result; // On enregistre avec le titre exact comme clé
        
        button.textContent = originalBtnText;
        button.disabled = false;
        
        updatePreview();
        saveData();
    }

    // --- 3. FONCTION D'APPEL API ---
    async function callAiAPI(prompt) {
        try {
            // URL de ton endpoint Vercel
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

    // --- 1. FONCTION D'EXPORTATION PDF ---
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

    // --- 2. GESTION DU BOUTON SUIVANT / WORD ---
    if (nextStepBtn) {
        nextStepBtn.addEventListener("click", () => {
            // Si le bouton est en mode "Export Word" (configuré dans Portion 2)
            if (nextStepBtn.classList.contains("is-word-btn")) {
                exportToWord();
            } else {
                // Comportement normal : étape suivante
                const index = stepsOrder.indexOf(currentStep);
                if (index < stepsOrder.length - 1) {
                    goToStep(stepsOrder[index + 1]);
                }
            }
        });
    }

    // --- 3. FONCTION D'EXPORTATION WORD ---
    function exportToWord() {
        const element = document.getElementById("preview-pages");
        if (!element || !element.innerHTML.trim()) return;

        // Préparation du contenu avec encodage pour les accents
        const contentHtml = element.innerHTML;
        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head><meta charset="utf-8"></head>
                <body>${contentHtml}</body>
            </html>
        `;

        try {
            // Utilise la bibliothèque html-docx-js
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

    // --- 4. INITIALISATION AU DÉMARRAGE ---
    const lastStep = loadData(); 

    if (content.plan || content.intro || content.dev || content.conclu) {
        updatePreview();
    }

    // On lance la navigation finale
    goToStep(lastStep);

    console.log("🚀 Système BuroMaster 2026 prêt.");
       
