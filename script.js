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
    
    // Nouveaux contrôles (Options et Zoom)
    const advancedOptionsBtn = document.getElementById("advancedOptionsBtn");
    const advancedPanel = document.getElementById("advancedPanel");
    const fontSelect = document.getElementById("fontSelect");
    const fontSizeInput = document.getElementById("fontSizeInput");
    const aiDetailLevel = document.getElementById("aiDetailLevel");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const zoomLevelSpan = document.getElementById("zoomLevel");

    // Boutons Historique
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");

    // --- 2. ÉTAT DE L'APPLICATION (VARIABLES GLOBALES) ---
    let currentStep = "plan"; 
    const stepsOrder = ["plan", "intro", "dev", "conclu"];
    let content = { plan: "", intro: "", dev: {}, conclu: "" };
    let isLocked = { plan: false, intro: false, dev: false, conclu: false };
    let reachedStepIndex = 0;
    let currentZoom = 0.6; // 60% par défaut
    let editorPreviewTimer = null;
    // À ajouter dans tes variables globales (Section 2)
    let lastSyncedPlan = ""; 


    // --- 3. GESTION DE L'HISTORIQUE (UNDO/REDO) ---
    // On stocke les versions précédentes de l'objet "content"
    let historyStack = []; 
    let redoStack = [];

    function saveToHistory() {
        // On limite l'historique à 20 actions pour ne pas ralentir le site
        if (historyStack.length > 20) historyStack.shift();
        
        // On enregistre une copie profonde du contenu actuel
        historyStack.push(JSON.parse(JSON.stringify(content)));
        
        // Quand on fait une nouvelle action, on vide la pile de "Redo"
        redoStack = [];
        updateHistoryButtons();
    }

    function undo() {
        if (historyStack.length > 0) {
            // On met le contenu actuel dans le redo avant de revenir en arrière
            redoStack.push(JSON.parse(JSON.stringify(content)));
            content = historyStack.pop();
            
            refreshUIFromData(); // On met à jour l'affichage
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            historyStack.push(JSON.parse(JSON.stringify(content)));
            content = redoStack.pop();
            
            refreshUIFromData();
        }
    }

    function updateHistoryButtons() {
        undoBtn.disabled = historyStack.length === 0;
        redoBtn.disabled = redoStack.length === 0;
        undoBtn.style.opacity = undoBtn.disabled ? "0.3" : "1";
        redoBtn.style.opacity = redoBtn.disabled ? "0.3" : "1";
    }

    // --- 4. SAUVEGARDE LOCALE (LOCALSTORAGE) ---
        function saveData() {
        const snapshot = {
            content,
            isLocked,
            reachedStepIndex,
            theme: themeInput.value,
            studentClass: studentClassInput.value,
            autoFormat: autoFormatCheckbox.checked,
            settings: {
                font: fontSelect.value,
                fontSize: fontSizeInput.value,
                aiLevel: aiDetailLevel.value
            },
            currentStep,
            lastUpdate: Date.now() // On enregistre l'heure précise de la sauvegarde
        };
        localStorage.setItem("buroMaster_v2_save", JSON.stringify(snapshot));
    }
    
    // --- 5. FONCTION DE CHARGEMENT ---
        function loadData() {
        try {
            const saved = localStorage.getItem("buroMaster_v2_save");
            if (saved) {
                const data = JSON.parse(saved);
                
                // --- LOGIQUE DES 12 HEURES ---
                const douzeHeuresEnMs = 12 * 60 * 60 * 1000;
                const tempsEcoule = Date.now() - (data.lastUpdate || 0);

                if (tempsEcoule > douzeHeuresEnMs) {
                    console.log("Délai de 12h dépassé, nettoyage des données...");
                    localStorage.removeItem("buroMaster_v2_save");
                    return "plan"; // On repart de zéro
                }
                // -----------------------------

                content = data.content || content;
                isLocked = data.isLocked || isLocked;
                reachedStepIndex = data.reachedStepIndex || 0;
                if (themeInput) themeInput.value = data.theme || "";
                if (studentClassInput) studentClassInput.value = data.studentClass || "";
                if (data.settings) {
                    fontSelect.value = data.settings.font || "'Times New Roman', serif";
                    fontSizeInput.value = data.settings.fontSize || "12";
                    aiDetailLevel.value = data.settings.aiLevel || "standard";
                }
                autoFormatCheckbox.checked = (data.autoFormat !== undefined) ? data.autoFormat : true;
                return data.currentStep || "plan";
            }
        } catch (e) {
            console.error("Erreur de chargement :", e);
        }
        return "plan";
    }

    // --- 6. MISE À JOUR DE L'INTERFACE (REFRESH UI) ---
    // Cette fonction est appelée après un Undo/Redo ou un changement d'étape
    function refreshUIFromData() {
        if (currentStep === "dev") {
            setupDevBlocks(); // On verra cette fonction en portion 3
        } else {
            editor.value = content[currentStep] || "";
        }
        updatePreview(); // Mise à jour de la feuille A4
        updateHistoryButtons();
    }

    function schedulePreviewRefresh(delay = 300) {
        clearTimeout(editorPreviewTimer);
        editorPreviewTimer = setTimeout(() => {
            if (currentStep !== "dev") {
                content[currentStep] = editor.value;
            }
            updatePreview();
            saveData();
        }, delay);
    }

       // --- 7. NAVIGATION ENTRE LES ÉTAPES ---
    function goToStep(step) {
        clearTimeout(editorPreviewTimer);

        if (currentStep !== "dev") {
            content[currentStep] = editor.value;
        }

        currentStep = step;

        const stepNames = { plan: "Plan", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
        stepTitle.textContent = "Édition : " + (stepNames[step] || step);
        
        const locked = isLocked[step];

        // --- NOUVEAU : Bloquer l'écriture si validé ---
        if (step !== "dev") {
            editor.readOnly = locked;
            editor.style.backgroundColor = locked ? "#f5f5f5" : "#fff";
            editor.style.cursor = locked ? "not-allowed" : "auto";
        }

        validateBtn.textContent = locked ? "Modifier cette étape" : "Valider cette étape";
        validateBtn.style.background = locked ? "#ff9800" : "#0aa64b";

        if (step === "conclu" && locked) {
            nextStepBtn.textContent = "Exporter en Word (.doc)";
            nextStepBtn.style.display = "block";
            nextStepBtn.classList.add("is-word-btn");
        } else {
            nextStepBtn.classList.remove("is-word-btn");
            const isNotLast = stepsOrder.indexOf(step) < stepsOrder.length - 1;
            nextStepBtn.style.display = (locked && isNotLast) ? "block" : "none";
            nextStepBtn.textContent = "Étape Suivante";
        }

        generateBtn.style.display = (!locked && step !== "dev") ? "block" : "none";

        if (step === "dev") {
            editor.style.display = "none";
            document.getElementById("dev-blocks-container").style.display = "block";
            setupDevBlocks(); 
        } else {
            editor.style.display = "block";
            editor.value = content[step] || "";
            document.getElementById("dev-blocks-container").style.display = "none";
        }

        updateHeaderUI(); 
        updatePreview();
        saveData(); 
    }

    function updateHeaderUI() {
        document.querySelectorAll(".step-link").forEach((link, index) => {
            const stepName = stepsOrder[index];
            link.classList.remove("active", "unlocked");
            
            // --- NOUVEAU : Afficher le cadenas 🔒 ---
            const labels = { plan: "Plan", intro: "Intro", dev: "Développement", conclu: "Conclusion" };
            let text = labels[stepName];
            if (isLocked[stepName]) {
                link.innerHTML = `<i class="fas fa-lock"></i> ${text}`;
            } else {
                link.innerHTML = text;
            }

            if (stepName === currentStep) {
                link.classList.add("active");
            } else if (index <= reachedStepIndex) {
                link.classList.add("unlocked");
            }
        });
    }

         // --- 8. GESTION DU BOUTON VALIDER ---
    validateBtn.addEventListener("click", () => {
        const isCurrentlyLocked = isLocked[currentStep];
        
        if (!isCurrentlyLocked) {
            saveToHistory();
            
            if (currentStep !== "dev") {
                content[currentStep] = editor.value;
            } else {
                // Bloquer les champs et cacher les boutons IA du Développement
                document.querySelectorAll(".sub-editor").forEach(txt => txt.readOnly = true);
                document.querySelectorAll(".generate-sub-btn").forEach(btn => btn.style.display = "none");
            }
            
            isLocked[currentStep] = true;
            reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
            showNotification("Étape validée et verrouillée ! 🔒");
        } else {
            isLocked[currentStep] = false;
            showNotification("Étape déverrouillée pour modification.");
        }
        
        goToStep(currentStep);
    });

    // --- 9. ANALYSEUR DE PLAN (PARSER) ---
    function parsePlanForDev(planText) {
        const sections = [];
        const lines = planText.split('\n');
        let currentSection = null;

        // Expression régulière plus flexible : I. ou I - ou 1.
        const sectionRegex = /^([IVX]+|[0-9]+)\s*[\.\-\)]\s+/;
        const subpartRegex = /^([A-Z]|[a-z])\s*[\.\-\)]\s+/;
        const numericSubpartRegex = /^([0-9]+(?:\.[0-9]+)+)\s*/;
        const bulletRegex = /^[-•]\s+/;

        lines.forEach(line => {
            const cleanLine = line.trim();
            // On ignore les lignes vides et uniquement les lignes exactes Introduction/Conclusion
            if (!cleanLine || /^(introduction|conclusion)$/i.test(cleanLine)) return; 

            if (numericSubpartRegex.test(cleanLine) && currentSection) {
                currentSection.subparts.push(cleanLine);
            } else if (bulletRegex.test(cleanLine) && currentSection) {
                currentSection.subparts.push(cleanLine);
            } else if (sectionRegex.test(cleanLine)) {
                currentSection = { title: cleanLine, subparts: [] };
                sections.push(currentSection);
            } else if (subpartRegex.test(cleanLine) && currentSection) {
                currentSection.subparts.push(cleanLine);
            }
        });
        return sections;
    }

    // --- 10. GÉNÉRATION DYNAMIQUE DES BLOCS ---
    function setupDevBlocks() {
        const container = document.getElementById("dev-blocks-container");
        if (!container) return;
        
        container.innerHTML = "";

        // --- CRÉATION DU BOUTON DE MISE À JOUR ---
        const syncBtn = document.createElement("button");
        syncBtn.id = "syncPlanBtn";
        syncBtn.className = "primary-btn";
        syncBtn.style.marginBottom = "20px";
        syncBtn.style.background = "#607d8b"; 
        syncBtn.innerHTML = `<i class="fas fa-sync"></i> Mise à jour du Plan`;

        const planHasChanged = (content.plan.trim() !== lastSyncedPlan.trim());
        const canSync = planHasChanged && !isLocked['dev'] && lastSyncedPlan !== "";
        
        syncBtn.disabled = !canSync;
        syncBtn.style.opacity = canSync ? "1" : "0.5";
        syncBtn.style.cursor = canSync ? "pointer" : "not-allowed";

        container.appendChild(syncBtn);

        if (lastSyncedPlan === "" && content.plan !== "") {
            lastSyncedPlan = content.plan;
        }

        syncBtn.addEventListener("click", () => {
            const choice = confirm("Le plan a été modifié. Choisissez votre option :\n\n- OK : Mettre à jour seulement les titres (conserve vos textes).\n- ANNULER : Tout réinitialiser (efface vos textes).");
            
            if (choice) {
                updateTitlesOnly();
            } else {
                const confirmReset = confirm("Êtes-vous sûr de vouloir TOUT supprimer dans le développement ?");
                if (confirmReset) {
                    content.dev = {}; 
                    lastSyncedPlan = content.plan;
                    setupDevBlocks(); 
                }
            }
        });

        // --- AFFICHAGE DES BLOCS ---
        if (isLocked['dev']) {
            renderDevBlocks(container, true);
        } else {
            renderDevBlocks(container, false);
        }
    }

    // FONCTION CORRIGÉE : Correction du bouton Développer
    function renderDevBlocks(container, locked) {
        const sections = parsePlanForDev(content.plan || "");
        if (sections.length === 0) {
            const msg = document.createElement("p");
            msg.style.color = "red";
            msg.textContent = "Aucun titre détecté dans le plan.";
            container.appendChild(msg);
            return;
        }

        sections.forEach(section => {
            const block = document.createElement("div");
            block.className = "dev-block";
            // ÉTAPE CRUCIALE : On définit le dataset AVANT d'attacher l'événement
            block.dataset.sectionTitle = section.title; 

            block.innerHTML = `
                <div class="block-header">
                    <strong style="color: var(--primary-color);">${section.title}</strong>
                    <button class="generate-sub-btn" style="display: ${locked ? 'none' : 'flex'}">
                        <i class="fas fa-robot"></i> Développer
                    </button>
                </div>
                <textarea class="sub-editor" placeholder="Développez cette partie..." ${locked ? 'readonly' : ''}>${content.dev[section.title] || ""}</textarea>
            `;
            container.appendChild(block);

            const textarea = block.querySelector(".sub-editor");
            const aiBtn = block.querySelector(".generate-sub-btn");

            textarea.addEventListener("input", (e) => {
                content.dev[section.title] = e.target.value;
                schedulePreviewRefresh(500);
            });

            // L'écouteur appelle maintenant correctement handleSubGeneration
            if (aiBtn) {
                aiBtn.addEventListener("click", () => {
                    handleSubGeneration(block, textarea, aiBtn);
                });
            }
        });
    }

    // --- OPTION 1 : MISE À JOUR DES TITRES UNIQUEMENT ---
    function updateTitlesOnly() {
        const newSections = parsePlanForDev(content.plan || "");
        const oldContentDev = { ...content.dev }; 
        const newContentDev = {};

        newSections.forEach((section, index) => {
            const oldTitles = Object.keys(oldContentDev);
            // On essaie de récupérer par titre, sinon par position
            const oldText = oldContentDev[section.title] || oldContentDev[oldTitles[index]] || "";
            newContentDev[section.title] = oldText;
        });

        content.dev = newContentDev;
        lastSyncedPlan = content.plan;
        setupDevBlocks();
        updatePreview();
        showNotification("Titres mis à jour ! Textes conservés.");
    }

// --- 11. GESTION DU ZOOM (VERSION CORRIGÉE) ---
function updateZoomUI() {
    const wrappers = document.querySelectorAll(".page-wrapper");
    const sheets = document.querySelectorAll(".preview-sheet");
    
    const scale = currentZoom;
    // Dimensions réelles A4 en pixels (environ 794x1123 pour 96dpi)
    const baseWidth = 210; // mm
    const baseHeight = 297; // mm

    wrappers.forEach(wrapper => {
        // On ajuste la taille du conteneur pour qu'il corresponde à la feuille zoomée
        wrapper.style.width = `${baseWidth * scale}mm`;
        wrapper.style.height = `${baseHeight * scale}mm`;
    });

    sheets.forEach(sheet => {
        sheet.style.transform = `scale(${scale})`;
        sheet.style.transformOrigin = "top left"; // Très important pour l'alignement
    });

    zoomLevelSpan.textContent = `${Math.round(scale * 100)}%`;
}

   // --- 12 & 13. MOTEUR DE RENDU (CORRIGÉ) ---

function updatePreview() {
    if (!pagesContainer) return;
    pagesContainer.innerHTML = ""; 
    
    let pageNum = 1;
    // On récupère l'objet page complet (le wrapper) pour gérer le zoom
    let currentPageObj = createNewPage(pageNum, pagesContainer);
    let currentPageContent = currentPageObj.content;

    // 1. Sommaire
    if (content.plan) {
        currentPageContent = renderSection("SOMMAIRE", content.plan, currentPageContent, () => { 
            pageNum++; 
            let newPage = createNewPage(pageNum, pagesContainer);
            return newPage.content;
        });
    }

    // 2. Introduction
    if (content.intro) {
        currentPageContent = renderSection("INTRODUCTION", content.intro, currentPageContent, () => { 
            pageNum++; 
            let newPage = createNewPage(pageNum, pagesContainer);
            return newPage.content;
        });
    }

    // 3. Développement
    const devSections = parsePlanForDev(content.plan || "");
    if (Object.keys(content.dev).length > 0) {
        currentPageContent = renderSection("DÉVELOPPEMENT", "", currentPageContent, () => {
            pageNum++; 
            let newPage = createNewPage(pageNum, pagesContainer);
            return newPage.content;
        });

        const orderedTitles = devSections.length ? devSections.map(s => s.title) : Object.keys(content.dev);
        
        orderedTitles.forEach((sectionTitle) => {
            if (!content.dev[sectionTitle]) return;
            currentPageContent = renderSection(sectionTitle, content.dev[sectionTitle], currentPageContent, () => {
                pageNum++; 
                let newPage = createNewPage(pageNum, pagesContainer);
                return newPage.content;
            });
        });
    }

    // 4. Conclusion
    if (content.conclu) {
        currentPageContent = renderSection("CONCLUSION", content.conclu, currentPageContent, () => { 
            pageNum++; 
            let newPage = createNewPage(pageNum, pagesContainer);
            return newPage.content;
        });
    }
    updateZoomUI(); // Applique le zoom sur les nouveaux wrappers
}

function renderSection(title, text, pageElement, onBreak) {
    const isAutoFormat = autoFormatCheckbox.checked;
    const selectedFont = fontSelect.value;
    const selectedSize = fontSizeInput.value + "px";
    const limitHeight = 920; // Augmenté légèrement pour utiliser plus d'espace A4

    if (title) {
        const t = document.createElement("div");
        t.className = "title-style";
        t.style.fontFamily = selectedFont;
        t.style.fontSize = (parseInt(fontSizeInput.value) + 2) + "px";
        t.style.color = "var(--primary-color)";
        t.textContent = title.toUpperCase();
        pageElement.appendChild(t);
    }

    const lines = text.split("\n");
    lines.forEach((line, index) => {
        const div = document.createElement("div");
        div.style.fontFamily = selectedFont;
        div.style.fontSize = selectedSize;
        
        if (isAutoFormat) {
            if (/^(introduction|conclusion)\b/i.test(line)) {
                div.className = "intro-conclu-style";
            } else if (/^([IVX]+|[0-9]+)\s*[\.\-\)]/.test(line)) {
                div.style.fontWeight = "bold";
                div.style.marginTop = "8px";
            } else if (/^([A-Z]|[a-z])\s*[\.\-\)]/.test(line)) {
                div.style.fontWeight = "600";
                div.style.marginLeft = "10px";
            } else {
                div.className = "text-style";
            }
        } else {
            div.className = "text-style";
        }

        div.textContent = line.trim() === "" ? "\u00A0" : line;
        pageElement.appendChild(div);

        // --- DÉTECTION DE DÉBORDEMENT AMÉLIORÉE ---
        // On ne saute de page que si ce n'est pas la dernière ligne vide du texte
        if (pageElement.scrollHeight > limitHeight && index < lines.length - 1) {
            pageElement.removeChild(div);
            pageElement = onBreak(); 
            pageElement.appendChild(div);
        }
    });
    return pageElement;
}

function createNewPage(num, container) {
    const wrapper = document.createElement("div");
    wrapper.className = "page-wrapper"; // Nécessaire pour ton CSS et le Zoom
    
    const currentTheme = themeInput.value || "MON EXPOSÉ";
    const studentClass = studentClassInput.value ? ` | ${studentClassInput.value}` : "";

    wrapper.innerHTML = `
        <div class="preview-sheet">
            <div class="page-header">${currentTheme}${studentClass}</div>
            <div class="page-content"></div>
            <div class="page-footer">Page ${num}</div>
        </div>
    `;
    
    container.appendChild(wrapper);
    return {
        wrapper: wrapper,
        content: wrapper.querySelector(".page-content")
    };
}
  
    // --- 14. LOGIQUE DE GÉNÉRATION IA ---
    if (generateBtn) {
        generateBtn.addEventListener("click", async () => {
            const theme = themeInput.value.trim();
            const studentClass = studentClassInput.value.trim() || "un élève";
            const detailLevel = aiDetailLevel.value; // concis, standard ou detaille

            if (!theme) {
                alert("Veuillez d'abord entrer un thème pour l'exposé.");
                return;
            }

            // Avant de générer, on sauve pour le Undo
            saveToHistory();

            let prompt = "";
            const detailInstruction = {
                "concis": "Fais des réponses brèves, directes et synthétiques.",
                "standard": "Fais un développement équilibré et scolaire.",
                "detaille": "Fais un développement très riche, approfondi avec beaucoup d'explications."
            }[detailLevel];

            if (currentStep === "plan") {
                prompt = `Agis comme un expert en rédaction scolaire. Génère UNIQUEMENT un plan détaillé pour l'exposé : "${theme}".
                    Niveau scolaire : ${studentClass}.
                    Instructions de longueur : ${detailInstruction}.
                    FORMAT STRICT : Introduction, I. Titre, A. Sous-partie, B. Sous-partie, Conclusion. Texte brut uniquement.`;
                   
            } else if (currentStep === "intro") {
                prompt = `Rédige une introduction scolaire pour un exposé sur : "${theme}".
                    Destiné à une classe de : ${studentClass}.
                    Ton : scolaire. Niveau de détail : ${detailInstruction}.
                    Contenu : Accroche, définition, problématique et annonce du plan.`;
                
            } else if (currentStep === "conclu") {
                prompt = `Rédige une conclusion pour un exposé sur : "${theme}".
                    Niveau : ${studentClass}. Style : ${detailInstruction}.
                    Contenu : Synthèse des points clés et ouverture.`;
            }
            
            // UI Feedback
            const originalValue = editor.value;
            editor.value = "⏳ L'IA de BuroMaster rédige pour vous... Veuillez patienter.";
            generateBtn.disabled = true;

                       const result = await callAiAPI(prompt);
            
            if (result) {
                editor.value = result;
                content[currentStep] = result;
                updatePreview();
                saveData();
            } else {
                // En cas d'erreur, on remet l'ancienne valeur et on notifie
                editor.value = originalValue;
                showNotification("❌ Une erreur est survenue. Vérifiez votre connexion ou votre serveur.");
            }
            generateBtn.disabled = false;
        });
    }

    // --- 15. DÉVELOPPEMENT DES SOUS-PARTIES (CORRIGÉ) ---
    async function handleSubGeneration(block, textarea, button) {
        const theme = themeInput.value.trim();
        const studentClass = studentClassInput.value.trim() || "scolaire";
        // Récupération directe et propre du titre stocké dans le bloc
        const sectionData = block.dataset.sectionTitle; 
        const detailLevel = aiDetailLevel.value;

        if (!theme) {
            showNotification("⚠️ Veuillez entrer un thème pour l'exposé.");
            return;
        }

        saveToHistory(); // Sauvegarde l'état actuel pour le Ctrl+Z

        const originalBtnHTML = button.innerHTML;
        const oldText = textarea.value; // On mémorise le texte actuel en cas d'erreur

        // UI Feedback : Chargement
        button.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Développe..."; 
        button.disabled = true;
        textarea.value = "⏳ L'IA analyse le plan et développe cette partie... Veuillez patienter.";
       
        const prompt = `Développe la partie suivante d'un exposé sur "${theme}".
            Niveau de la classe : ${studentClass}.
            TITRE À DÉVELOPPER : ${sectionData}.
            Niveau de détail : ${detailLevel}.
            CONSIGNES : Rédige des paragraphes fluides et structurés. Ne répète pas le titre.`;
       
        const result = await callAiAPI(prompt);
        
        if (result) {
            // SI SUCCÈS
            textarea.value = result;
            content.dev[sectionData] = result;
            updatePreview();
            saveData();
        } else {
            // SI ÉCHEC
            textarea.value = oldText; // On restaure l'ancien contenu
            showNotification("❌ Échec de la génération. Vérifiez votre connexion.");
        }
        
        // On remet le bouton dans son état normal
        button.innerHTML = originalBtnHTML;
        button.disabled = false;
    }

    // --- 16. APPEL API (SÉCURISÉ) ---
    async function callAiAPI(prompt) {
        try {
            const API_URL = `${window.location.origin}/api/generate`;
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) throw new Error("Erreur serveur");
            
            const data = await response.json();
            return data.text || null;
        } catch (err) {
            console.error("Erreur API:", err);
            return null; // On renvoie null pour indiquer une erreur
        }
    }

    // --- 17. GESTION DES OPTIONS AVANCÉES ---
    advancedOptionsBtn.addEventListener("click", () => {
        // Alterne l'affichage du panneau (Show/Hide)
        const isHidden = advancedPanel.style.display === "none";
        advancedPanel.style.display = isHidden ? "flex" : "none";
    });

    // Mettre à jour l'aperçu dès qu'une option de style change
    [fontSelect, fontSizeInput, aiDetailLevel, autoFormatCheckbox].forEach(el => {
        el.addEventListener("change", () => {
            updatePreview();
            saveData();
        });
    });

    // Mise à jour live de l'aperçu pendant la saisie (avec délai anti-bugs)
    editor.addEventListener("input", () => {
        if (currentStep === "dev") return;
        schedulePreviewRefresh(300);
    });

    [themeInput, studentClassInput].forEach((el) => {
        el.addEventListener("input", () => {
            schedulePreviewRefresh(300);
        });
    });

    // --- 18. EXPORT PDF HAUTE QUALITÉ (CORRIGÉ) ---
    downloadBtn.addEventListener("click", () => {
        // On sélectionne toutes les feuilles, pas le fond gris
        const sheets = document.querySelectorAll(".preview-sheet");
        if (sheets.length === 0) {
            alert("L'exposé est vide.");
            return;
        }

        const originalZoom = currentZoom;
        currentZoom = 1.0;
        updateZoomUI();

        // On crée un conteneur temporaire propre pour l'export
        const worker = document.createElement("div");
        sheets.forEach(s => {
            const clone = s.cloneNode(true);
            clone.style.transform = "none"; // On retire le zoom sur le clone
            clone.style.margin = "0";
            worker.appendChild(clone);
        });

        const themeFileName = themeInput.value.replace(/[^a-z0-9]/gi, '_') || "Expose";
        
        const options = {
            margin: 0,
            filename: `BuroMaster_${themeFileName}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { 
                scale: 2, // 2 est suffisant pour du HD sans faire ramer le navigateur
                useCORS: true,
                logging: false
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: 'avoid-all', before: '.preview-sheet' }
        };

        html2pdf().set(options).from(worker).save().then(() => {
            currentZoom = originalZoom;
            updateZoomUI();
        });
    });

    // --- 19. EXPORT WORD (SÉCURISÉ) ---
    function exportToWord() {
        const sheets = document.querySelectorAll(".preview-sheet");
        if (sheets.length === 0) return;

        // On prépare un HTML propre pour Word
        let contentHtml = "";
        sheets.forEach(s => {
            contentHtml += s.innerHTML + '<br style="page-break-after: always;">';
        });

        const styles = `<style>
            body { font-family: "Times New Roman", serif; padding: 20px; }
            .page-header { color: #0aa64b; font-size: 10pt; border-bottom: 1px solid #ccc; }
            .title-style { font-size: 16pt; font-weight: bold; color: black; margin-top: 20px; }
            .text-style { font-size: 12pt; margin-bottom: 10px; text-align: justify; }
        </style>`;

        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body>${contentHtml}</body></html>`;

        try {
            // Utilisation de la lib chargée dans le HTML
            const converted = htmlDocx.asBlob(fullHtml);
            const link = document.createElement("a");
            link.href = URL.createObjectURL(converted);
            link.download = "BuroMaster_Expose.docx";
            link.click();
        } catch (e) {
            console.error(e);
            alert("Erreur lors de l'export Word.");
        }
    }
    // --- 20. INITIALISATION FINALE ---
    // On active les raccourcis clavier
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
        if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    });

    undoBtn.addEventListener("click", undo);
    redoBtn.addEventListener("click", redo);

    // Lancement de l'application
    const lastStep = loadData(); 
    refreshUIFromData();
    goToStep(lastStep);

    Object.entries(stepLinks).forEach(([step, link]) => {
        if (!link) return;
        link.addEventListener("click", () => {
            const targetIndex = stepsOrder.indexOf(step);
            if (targetIndex <= reachedStepIndex) {
                goToStep(step);
            }
        });
    });
    
    // --- 21. Boutont de réinitialisation ---
    const resetBtn = document.getElementById("resetAllBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            const confirmation = confirm("⚠️ Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible et supprimera tout votre travail actuel.");
            
            if (confirmation) {
                // 1. Vide le LocalStorage
                localStorage.removeItem("buroMaster_v2_save");
                
                // 2. Recharge la page pour tout remettre à zéro proprement
                window.location.reload();
            }
        });
    }

     function showNotification(message) {
        const toast = document.createElement("div");
        toast.className = "toast-notification";
        toast.textContent = message;
        document.body.appendChild(toast);

        // Supprime la notification après 4 secondes
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.5s ease";
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    console.log("🚀 BuroMaster 2026 : Système prêt.");
}); // Fin du DOMContentLoaded
                          
