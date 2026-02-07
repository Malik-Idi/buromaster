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
    
       // --- 7. NAVIGATION ENTRE LES ÉTAPES (VERSION FINALE) ---
    function goToStep(step) {
        clearTimeout(editorPreviewTimer);

        // Sauvegarde de sécurité du texte actuel
        if (currentStep !== "dev") {
            content[currentStep] = editor.value;
        }

        currentStep = step;

        const stepNames = { plan: "Plan", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
        stepTitle.textContent = "Édition : " + (stepNames[step] || step);
        
        const locked = isLocked[step];

        // Bloquer l'écriture si l'étape est validée
        if (step !== "dev") {
            editor.readOnly = locked;
            editor.style.backgroundColor = locked ? "#f5f5f5" : "#fff";
            editor.style.cursor = locked ? "not-allowed" : "auto";
        }

        // Configuration du bouton Valider
        validateBtn.textContent = locked ? "Modifier cette étape" : "Valider cette étape";
        validateBtn.style.background = locked ? "#ff9800" : "#0aa64b";

        // --- LOGIQUE DU BOUTON SUIVANT / WORD ---
        if (step === "conclu" && locked) {
            // Cas final : Conclusion validée -> Proposer le Word
            nextStepBtn.textContent = "Exporter en Word (.doc)";
            nextStepBtn.style.display = "block";
            nextStepBtn.classList.add("is-word-btn");
        } else {
            // Cas standard : Afficher "Suivant" seulement si l'étape est verrouillée et qu'il y a une suite
            nextStepBtn.classList.remove("is-word-btn");
            const currentIndex = stepsOrder.indexOf(step);
            const hasNext = currentIndex < stepsOrder.length - 1;
            
            if (locked && hasNext) {
                nextStepBtn.style.display = "block";
                nextStepBtn.textContent = "Étape Suivante";
            } else {
                nextStepBtn.style.display = "none";
            }
        }

        // Gestion du bouton IA
        generateBtn.style.display = (!locked && step !== "dev") ? "block" : "none";

        // Bascule entre l'éditeur texte et les blocs de développement
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
            
            const labels = { plan: "Plan", intro: "Intro", dev: "Développement", conclu: "Conclusion" };
            let text = labels[stepName];
            
            // Affichage du cadenas si verrouillé
            if (isLocked[stepName]) {
                link.innerHTML = `<i class="fas fa-lock"></i> ${text}`;
            } else {
                link.innerHTML = text;
            }

            // État actif ou débloqué
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

        // --- BOUTON DE MISE À JOUR ---
        const syncBtn = document.createElement("button");
        syncBtn.id = "syncPlanBtn";
        syncBtn.className = "primary-btn";
        syncBtn.style.marginBottom = "20px";
        syncBtn.style.background = "#607d8b"; 
        syncBtn.innerHTML = `<i class="fas fa-sync"></i> Mise à jour du Plan`;

        // Activation intelligente
        const planHasChanged = (content.plan.trim() !== lastSyncedPlan.trim());
        const canSync = planHasChanged && !isLocked['dev'] && lastSyncedPlan !== "";
        
        syncBtn.disabled = !canSync;
        syncBtn.style.opacity = canSync ? "1" : "0.5";
        syncBtn.style.cursor = canSync ? "pointer" : "not-allowed";

        container.appendChild(syncBtn);

        if (lastSyncedPlan === "" && content.plan !== "") {
            lastSyncedPlan = content.plan;
        }

        // Événement d'ouverture de la Modal
        syncBtn.addEventListener("click", () => {
            const modal = document.getElementById("syncModal");
            modal.style.display = "flex";

            document.getElementById("btnSyncTitles").onclick = () => {
                if(confirm("Mettre à jour les titres en gardant vos textes ?")) {
                    updateTitlesOnly();
                    modal.style.display = "none";
                }
            };

            document.getElementById("btnSyncAll").onclick = () => {
                if(confirm("⚠️ Action irréversible : Effacer tout le développement ?")) {
                    content.dev = {}; 
                    lastSyncedPlan = content.plan;
                    modal.style.display = "none";
                    setupDevBlocks();
                    updatePreview();
                }
            };

            document.getElementById("btnCancelSync").onclick = () => {
                modal.style.display = "none";
            };
        });

        // Dessiner les blocs
        renderDevBlocks(container, isLocked['dev']);
    }

    function renderDevBlocks(container, locked) {
        const sections = parsePlanForDev(content.plan || "");
        if (sections.length === 0) {
            container.innerHTML += "<p style='color:red; padding:10px;'>Aucun titre détecté.</p>";
            return;
        }

        sections.forEach(section => {
            const block = document.createElement("div");
            block.className = "dev-block";
            block.dataset.sectionTitle = section.title; 

            block.innerHTML = `
                <div class="block-header">
                    <strong style="color: var(--primary-color);">${section.title}</strong>
                    <button class="generate-sub-btn" style="display: ${locked ? 'none' : 'flex'}">
                        <i class="fas fa-robot"></i> Développer
                    </button>
                </div>
                <textarea class="sub-editor" placeholder="Rédigez ici..." ${locked ? 'readonly' : ''}>${content.dev[section.title] || ""}</textarea>
            `;
            container.appendChild(block);

            const textarea = block.querySelector(".sub-editor");
            const aiBtn = block.querySelector(".generate-sub-btn");

            textarea.addEventListener("input", () => {
                content.dev[section.title] = textarea.value;
                schedulePreviewRefresh(500);
            });

            if (aiBtn) {
                aiBtn.addEventListener("click", () => handleSubGeneration(block, textarea, aiBtn));
            }
        });
    }

    // --- 10 & 10b. SYNCHRONISATION INTELLIGENTE DU PLAN ---

function updateTitlesOnly() {
    const newSections = parsePlanForDev(content.plan || "");
    const oldContentDev = { ...content.dev }; // Copie de sauvegarde de l'ancien développement
    const newContentDev = {};

    // Liste des anciens titres pour la récupération par position
    const oldTitles = Object.keys(oldContentDev);

    newSections.forEach((section, index) => {
        const newTitle = section.title;

        // STRATÉGIE DE RÉCUPÉRATION :
        // 1. On cherche si le texte existe déjà pour ce titre EXACT
        if (oldContentDev[newTitle] !== undefined) {
            newContentDev[newTitle] = oldContentDev[newTitle];
        } 
        // 2. Sinon, on récupère le texte qui était à la même POSITION (ex: I devient 1.)
        else if (oldTitles[index] !== undefined) {
            newContentDev[newTitle] = oldContentDev[oldTitles[index]];
        }
        // 3. Sinon, on laisse vide pour une nouvelle rédaction
        else {
            newContentDev[newTitle] = "";
        }
    });

    // On remplace l'ancien développement par le nouveau structuré
    content.dev = newContentDev;
    lastSyncedPlan = content.plan; // On marque le plan comme synchronisé
    
    setupDevBlocks(); // On redessine les éditeurs
    updatePreview();  // On met à jour l'aperçu A4
    showNotification("✅ Structure mise à jour (textes conservés) !");
}

// --- 11. GESTION DU ZOOM (LOGIQUE ET BOUTONS) ---

// 1. Fonction qui applique le zoom visuellement
function updateZoomUI() {
    const wrappers = document.querySelectorAll(".page-wrapper");
    const sheets = document.querySelectorAll(".preview-sheet");
    
    const scale = currentZoom;
    const baseWidth = 210; // mm (Largeur A4)
    const baseHeight = 297; // mm (Hauteur A4)

     wrappers.forEach(wrapper => {
        // On ajoute +20mm de marge de sécurité multipliée par le scale
        // pour éviter que les pages ne se chevauchent à haut zoom
        const safetyMargin = 10 * scale; 
        wrapper.style.width = `${baseWidth * scale}mm`;
        wrapper.style.height = `${(baseHeight * scale) + safetyMargin}mm`;
    });

    sheets.forEach(sheet => {
        sheet.style.transform = `scale(${scale})`;
        sheet.style.transformOrigin = "top left"; 
    });

    if (zoomLevelSpan) {
        zoomLevelSpan.textContent = `${Math.round(scale * 100)}%`;
    }
}

// 2. Écouteurs de clics pour les boutons Zoom (À placer dans le DOMContentLoaded)
if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
        if (currentZoom < 1.5) { // Limite max 150%
            currentZoom += 0.1;
            updateZoomUI();
        }
    });
}

if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
        if (currentZoom > 0.3) { // Limite min 30%
            currentZoom -= 0.1;
            updateZoomUI();
        }
    });
}

// --- 12. MOTEUR DE RENDU (LOGIQUE DE GÉNÉRATION DES PAGES) ---
function updatePreview() {
    if (!pagesContainer) return;
    pagesContainer.innerHTML = ""; 
    
    let pageNum = 1;

    // 1. Sommaire (Force sa propre page au début)
    if (content.plan) {
        let currentPageObj = createNewPage(pageNum, pagesContainer);
        renderSection("SOMMAIRE", content.plan, currentPageObj.content, () => { 
            pageNum++; 
            currentPageObj = createNewPage(pageNum, pagesContainer);
            return currentPageObj.content;
        });
        pageNum++; 
    }

    // 2. Introduction (Force une nouvelle page)
    if (content.intro) {
        let currentPageObj = createNewPage(pageNum, pagesContainer);
        renderSection("INTRODUCTION", content.intro, currentPageObj.content, () => { 
            pageNum++; 
            currentPageObj = createNewPage(pageNum, pagesContainer);
            return currentPageObj.content;
        });
        pageNum++;
    }

    // 3. Développement (Force une nouvelle page)
    const devSections = parsePlanForDev(content.plan || "");
    if (Object.keys(content.dev).length > 0) {
        let currentPageObj = createNewPage(pageNum, pagesContainer);
        
        renderSection("DÉVELOPPEMENT", "", currentPageObj.content, () => {
            pageNum++; 
            currentPageObj = createNewPage(pageNum, pagesContainer);
            return currentPageObj.content;
        });

        const orderedTitles = devSections.length ? devSections.map(s => s.title) : Object.keys(content.dev);
        
        orderedTitles.forEach((sectionTitle) => {
            if (!content.dev[sectionTitle]) return;
            let nextContent = renderSection(sectionTitle, content.dev[sectionTitle], currentPageObj.content, () => {
                pageNum++; 
                currentPageObj = createNewPage(pageNum, pagesContainer);
                return currentPageObj.content;
            });
            currentPageObj.content = nextContent; 
        });
        pageNum++;
    }

    // 4. Conclusion (Force une nouvelle page)
    if (content.conclu) {
        let currentPageObj = createNewPage(pageNum, pagesContainer);
        renderSection("CONCLUSION", content.conclu, currentPageObj.content, () => { 
            pageNum++; 
            currentPageObj = createNewPage(pageNum, pagesContainer);
            return currentPageObj.content;
        });
    }

    updateZoomUI();
}

// --- 13. MOTEUR DE RENDU (DESSIN DES SECTIONS ET DÉTECTION DÉBORDEMENT) - VERSION CORRIGÉE ---
function renderSection(title, text, pageElement, onBreak) {
    const isAutoFormat = autoFormatCheckbox.checked;
    const selectedFont = fontSelect.value;
    const selectedSize = fontSizeInput.value + "px";
    const limitHeight = 910; 

    // 1. Gestion du titre de section
    if (title) {
        const t = document.createElement("div");
        t.className = "title-style";
        t.style.fontFamily = selectedFont;
        t.style.fontSize = (parseInt(fontSizeInput.value) + 2) + "px";
        t.style.color = "var(--primary-color)";
        t.textContent = title.toUpperCase();
        pageElement.appendChild(t);
        
        // Sécurité : si le titre seul fait déborder (cas rare)
        if (pageElement.scrollHeight > limitHeight) {
            pageElement.removeChild(t);
            pageElement = onBreak();
            pageElement.appendChild(t);
        }
    }

    if (!text) return pageElement;

    // 2. Découpage par paragraphes (lignes saisies)
    const paragraphs = text.split("\n");
    
    for (let p = 0; p < paragraphs.length; p++) {
        const paragraphText = paragraphs[p];
        if (paragraphText.trim() === "" && p !== paragraphs.length - 1) {
            // Gestion des lignes vides (saut de ligne)
            const emptyDiv = document.createElement("div");
            emptyDiv.style.height = "1em";
            emptyDiv.innerHTML = "&nbsp;";
            pageElement.appendChild(emptyDiv);
            continue;
        }

        // Création du conteneur pour le paragraphe
        let div = document.createElement("div");
        div.style.fontFamily = selectedFont;
        div.style.fontSize = selectedSize;
        div.className = "text-style";

        // Application du formatage automatique (uniquement si activé)
        if (isAutoFormat) {
            if (/^(introduction|conclusion)\b/i.test(paragraphText)) {
                div.className = "intro-conclu-style";
            } else if (/^([IVX]+|[0-9]+)\s*[\.\-\)]/.test(paragraphText)) {
                div.style.fontWeight = "bold";
                div.style.marginTop = "8px";
            } else if (/^([A-Z]|[a-z])\s*[\.\-\)]/.test(paragraphText)) {
                div.style.fontWeight = "600";
                div.style.marginLeft = "10px";
            }
        }

        pageElement.appendChild(div);

        // --- LOGIQUE DE DÉCOUPAGE PAR MOTS ---
        const words = paragraphText.split(" ");
        let currentTextInDiv = "";

        for (let w = 0; w < words.length; w++) {
            const word = words[w];
            const previousText = div.textContent;
            
            // On teste l'ajout du mot suivant
            div.textContent += (w === 0 ? "" : " ") + word;

            // Si le scroll dépasse la limite A4
            if (pageElement.scrollHeight > limitHeight) {
                // On retire le mot qui a fait déborder
                div.textContent = previousText;
                
                // On crée une nouvelle page
                pageElement = onBreak();
                
                // On crée une nouvelle div sur la nouvelle page avec le même style
                let newDiv = document.createElement("div");
                newDiv.style.fontFamily = selectedFont;
                newDiv.style.fontSize = selectedSize;
                newDiv.className = div.className;
                newDiv.style.fontWeight = div.style.fontWeight;
                newDiv.style.marginLeft = div.style.marginLeft;
                
                pageElement.appendChild(newDiv);
                
                // On continue le remplissage dans la nouvelle div
                div = newDiv;
                div.textContent = word; // Le mot qui avait débordé commence ici
            }
        }
    }
    return pageElement;
}

// --- 13b. CRÉATION PHYSIQUE DES PAGES A4 ---
function createNewPage(num, container) {
    const wrapper = document.createElement("div");
    wrapper.className = "page-wrapper";
    
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

    // --- 19. EXPORT WORD ET NAVIGATION (SÉCURISÉ) ---
    
    // 1. Gestion du clic sur le bouton "Suivant" ou "Word"
    if (nextStepBtn) {
        nextStepBtn.onclick = () => {
            // Si le bouton est en mode "Export Word"
            if (nextStepBtn.classList.contains("is-word-btn")) {
                exportToWord();
            } else {
                // Sinon, on passe à l'étape suivante
                const currentIndex = stepsOrder.indexOf(currentStep);
                if (currentIndex < stepsOrder.length - 1) {
                    const nextStep = stepsOrder[currentIndex + 1];
                    goToStep(nextStep);
                    // Remonte en haut de la page pour le confort
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        };
    }

    // 2. Fonction technique d'exportation
    function exportToWord() {
        const sheets = document.querySelectorAll(".preview-sheet");
        if (sheets.length === 0) {
            showNotification("L'exposé est vide !");
            return;
        }

        // On prépare un HTML propre pour Word
        let contentHtml = "";
        sheets.forEach(s => {
            contentHtml += s.innerHTML + '<br style="page-break-after: always;">';
        });

        const styles = `<style>
            body { font-family: "Times New Roman", serif; padding: 20px; }
            .page-header { color: #0aa64b; font-size: 10pt; border-bottom: 1px solid #ccc; margin-bottom: 15px; }
            .title-style { font-size: 16pt; font-weight: bold; color: black; margin-top: 20px; text-transform: uppercase; }
            .text-style { font-size: 12pt; margin-bottom: 10px; text-align: justify; line-height: 1.4; }
            .page-footer { text-align: center; font-size: 9pt; color: #666; margin-top: 20px; }
        </style>`;

        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body>${contentHtml}</body></html>`;

        try {
            if (typeof htmlDocx === "undefined") {
                showNotification("❌ Erreur : Bibliothèque Word non chargée.");
                return;
            }
            const converted = htmlDocx.asBlob(fullHtml);
            const link = document.createElement("a");
            link.href = URL.createObjectURL(converted);
            link.download = `BuroMaster_Expose_${themeInput.value || "complet"}.docx`;
            link.click();
            showNotification("✅ Document Word généré !");
        } catch (e) {
            console.error(e);
            showNotification("❌ Erreur lors de l'export Word.");
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

    // Fonction commune pour changer d'étape
    const handleNavigation = () => {
        const targetIndex = stepsOrder.indexOf(step);
        if (targetIndex <= reachedStepIndex) {
            goToStep(step);
        } else {
            showNotification("🔒 Cette étape est encore verrouillée.");
        }
    };

    // Gestion du clic souris
    link.addEventListener("click", handleNavigation);

    // Gestion de la touche Entrée au clavier
    link.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNavigation();
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
                          
