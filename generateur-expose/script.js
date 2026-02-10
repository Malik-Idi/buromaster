document.addEventListener("DOMContentLoaded", function () {
    /**
     * --- 1. SÉLECTION SÉCURISÉE DES ÉLÉMENTS ---
     * Utilisation d'un helper pour éviter que le script ne s'arrête si un ID manque.
     */
    const getEl = (id) => document.getElementById(id);

    const ui = {
        editor: getEl("editor"),
        theme: getEl("theme"),
        studentClass: getEl("studentClass"),
        pagesContainer: getEl("preview-pages"),
        stepTitle: getEl("step-title"),
        validateBtn: getEl("validateBtn"),
        nextStepBtn: getEl("nextStepBtn"),
        generateBtn: getEl("generateBtn"),
        downloadBtn: getEl("downloadPdf"),
        autoFormatCheckbox: getEl("autoFormatCheckbox"),
        resetAllBtn: getEl("resetAllBtn"),
        fontSelect: getEl("fontSelect"),
        fontSizeInput: getEl("fontSizeInput"),
        aiDetailLevel: getEl("aiDetailLevel"),
        zoomInBtn: getEl("zoomInBtn"),
        zoomOutBtn: getEl("zoomOutBtn"),
        zoomLevelSpan: getEl("zoomLevel"),
        undoBtn: getEl("undoBtn"),
        redoBtn: getEl("redoBtn"),
        devBlocksContainer: getEl("dev-blocks-container"),
        advancedPanel: getEl("advancedPanel")
    };

    /**
     * --- 2. ÉTAT DE L'APPLICATION (STATE MANAGEMENT) ---
     */
    const CONFIG = {
        STORAGE_KEY: "buroMaster_premium_save",
        MAX_HISTORY: 30,
        EXPIRATION_MS: 12 * 60 * 60 * 1000 // 12 heures
    };

    let currentStep = "plan"; 
    const stepsOrder = ["plan", "intro", "dev", "conclu"];
    
    // Objet de données principal
    let content = { 
        plan: "", 
        intro: "", 
        dev: {}, // Stockage par titres de sections
        conclu: "" 
    };

    let isLocked = { 
        plan: false, 
        intro: false, 
        dev: false, 
        conclu: false 
    };

    let reachedStepIndex = 0;
    let currentZoom = 0.6; 
    let lastSyncedPlan = ""; 
    let historyStack = [];
    let redoStack = [];

    /**
     * --- 3. SYSTÈME D'HISTORIQUE ROBUSTE ---
     * Utilise le clonage profond pour éviter les mutations accidentelles.
     */
    function saveToHistory() {
        try {
            if (historyStack.length >= CONFIG.MAX_HISTORY) historyStack.shift();
            
            // On sauvegarde une copie immuable de l'état actuel
            historyStack.push(JSON.parse(JSON.stringify({
                content: content,
                isLocked: isLocked,
                reachedStepIndex: reachedStepIndex
            })));

            redoStack = []; // On vide le redo à chaque nouvelle action
            updateHistoryButtons();
        } catch (err) {
            console.error("Erreur historique:", err);
        }
    }

    function undo() {
        if (historyStack.length === 0) return;
        
        // On place l'état actuel dans le redo
        redoStack.push(JSON.parse(JSON.stringify({
            content: content,
            isLocked: isLocked,
            reachedStepIndex: reachedStepIndex
        })));

        const previousState = historyStack.pop();
        content = previousState.content;
        isLocked = previousState.isLocked;
        reachedStepIndex = previousState.reachedStepIndex;

        refreshUIFromData();
        showNotification("Action annulée ↩️");
    }

    function redo() {
        if (redoStack.length === 0) return;

        historyStack.push(JSON.parse(JSON.stringify({
            content: content,
            isLocked: isLocked,
            reachedStepIndex: reachedStepIndex
        })));

        const nextState = redoStack.pop();
        content = nextState.content;
        isLocked = nextState.isLocked;
        reachedStepIndex = nextState.reachedStepIndex;

        refreshUIFromData();
        showNotification("Action rétablie ↪️");
    }

    function updateHistoryButtons() {
        if (ui.undoBtn) {
            ui.undoBtn.disabled = historyStack.length === 0;
            ui.undoBtn.style.opacity = ui.undoBtn.disabled ? "0.4" : "1";
            ui.undoBtn.style.cursor = ui.undoBtn.disabled ? "not-allowed" : "pointer";
        }
        if (ui.redoBtn) {
            ui.redoBtn.disabled = redoStack.length === 0;
            ui.redoBtn.style.opacity = ui.redoBtn.disabled ? "0.4" : "1";
            ui.redoBtn.style.cursor = ui.redoBtn.disabled ? "not-allowed" : "pointer";
        }
    }

    /**
     * --- 4. PERSISTANCE DES DONNÉES (LOCALSTORAGE) ---
     */
    function saveData() {
        try {
            const snapshot = {
                content,
                isLocked,
                reachedStepIndex,
                theme: ui.theme ? ui.theme.value : "",
                studentClass: ui.studentClass ? ui.studentClass.value : "",
                autoFormat: ui.autoFormatCheckbox ? ui.autoFormatCheckbox.checked : true,
                settings: {
                    font: ui.fontSelect ? ui.fontSelect.value : "'Times New Roman', serif",
                    fontSize: ui.fontSizeInput ? ui.fontSizeInput.value : "12",
                    aiLevel: ui.aiDetailLevel ? ui.aiDetailLevel.value : "standard"
                },
                currentStep,
                lastUpdate: Date.now()
            };
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(snapshot));
        } catch (e) {
            console.warn("Échec de la sauvegarde locale :", e);
        }
    }

    /**
     * --- 5. CHARGEMENT ET VÉRIFICATION D'INTEGRITÉ ---
     */
    function loadData() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!saved) return "plan";

            const data = JSON.parse(saved);
            const isExpired = (Date.now() - (data.lastUpdate || 0)) > CONFIG.EXPIRATION_MS;

            if (isExpired) {
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                return "plan";
            }

            // Restauration intelligente des données
            content = data.content || content;
            isLocked = data.isLocked || isLocked;
            reachedStepIndex = data.reachedStepIndex || 0;
            
            if (ui.theme) ui.theme.value = data.theme || "";
            if (ui.studentClass) ui.studentClass.value = data.studentClass || "";
            if (data.settings) {
                if (ui.fontSelect) ui.fontSelect.value = data.settings.font;
                if (ui.fontSizeInput) ui.fontSizeInput.value = data.settings.fontSize;
                if (ui.aiDetailLevel) ui.aiDetailLevel.value = data.settings.aiLevel;
            }
            if (ui.autoFormatCheckbox) ui.autoFormatCheckbox.checked = !!data.autoFormat;
            
            return data.currentStep || "plan";
        } catch (e) {
            console.error("Erreur lors du chargement des données :", e);
            return "plan";
        }
    }

    /**
     * --- 6. SYNCHRONISATION UI/DONNÉES ---
     */
    function refreshUIFromData() {
        // Bloque le rendu si on est en train de charger
        if (currentStep === "dev") {
            if (typeof setupDevBlocks === "function") setupDevBlocks(); 
        } else {
            if (ui.editor) ui.editor.value = content[currentStep] || "";
        }
        
        // Met à jour la prévisualisation A4
        if (typeof updatePreview === "function") updatePreview();
        
        updateHistoryButtons();
        updateHeaderUI(); // Sera défini dans la partie suivante
    }
    
    /**
     * --- 7. NAVIGATION ENTRE LES ÉTAPES ---
     * Gère le passage d'une section à l'autre avec validation de l'état.
     */
    function goToStep(step) {
        if (!stepsOrder.includes(step)) return;

        // 1. Sauvegarde l'état actuel du texte (si pas en mode dev)
        if (currentStep !== "dev" && ui.editor) {
            content[currentStep] = ui.editor.value;
        }

        currentStep = step;

        // 2. Mise à jour des titres et indicateurs
        const stepNames = { plan: "Sommaire", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
        if (ui.stepTitle) {
            ui.stepTitle.textContent = `Édition : ${stepNames[step]}`;
        }
        
        const locked = isLocked[step];

        // 3. Configuration des boutons d'action
        if (ui.validateBtn) {
            ui.validateBtn.textContent = locked ? "Modifier cette étape" : "Valider cette étape";
            ui.validateBtn.style.backgroundColor = locked ? "#f59e0b" : "#10b981";
        }

        // 4. Logique du bouton Suivant / Export
        if (ui.nextStepBtn) {
            const currentIndex = stepsOrder.indexOf(step);
            if (step === "conclu" && locked) {
                ui.nextStepBtn.textContent = "Exporter en Word (.doc)";
                ui.nextStepBtn.style.display = "block";
                ui.nextStepBtn.onclick = () => { if(typeof exportToWord === "function") exportToWord(); };
            } else if (locked && currentIndex < stepsOrder.length - 1) {
                ui.nextStepBtn.textContent = "Étape Suivante";
                ui.nextStepBtn.style.display = "block";
                ui.nextStepBtn.onclick = () => goToStep(stepsOrder[currentIndex + 1]);
            } else {
                ui.nextStepBtn.style.display = "none";
            }
        }

        // 5. Affichage des panneaux (Éditeur classique vs Blocs Dev)
        if (ui.generateBtn) ui.generateBtn.style.display = (!locked && step !== "dev") ? "block" : "none";
        if (ui.devBlocksContainer) {
            ui.devBlocksContainer.style.display = (step === "dev") ? "block" : "none";
        }
        if (ui.editor) {
            ui.editor.style.display = (step === "dev") ? "none" : "block";
        }

        // 6. Rafraîchissement complet
        refreshUIFromData();
        saveData(); 
    }

    /**
     * --- 8. MOTEUR DE RENDU (PRÉVISUALISATION A4) ---
     * Transforme les données textuelles en pages physiques.
     */
    function updatePreview() {
        if (!ui.pagesContainer) return;
        
        // On vide proprement le conteneur
        ui.pagesContainer.innerHTML = ""; 
        let pageNum = 1;

        // Création de la première page
        let currentFullPage = createNewPage(pageNum, ui.pagesContainer);
        const locked = isLocked[currentStep];

        // Configuration de la zone éditable
        const contentArea = currentFullPage.content;
        contentArea.contentEditable = !locked;
        contentArea.style.cursor = locked ? "not-allowed" : "text";

        if (currentStep !== "dev") {
            const titles = { plan: "SOMMAIRE", intro: "INTRODUCTION", conclu: "CONCLUSION" };
            renderTextToPages(titles[currentStep], content[currentStep], currentFullPage, (nextNum) => {
                return createNewPage(nextNum, ui.pagesContainer);
            });
        } else {
            // Appel de la fonction de rendu spécifique au développement
            if (typeof renderDevOnA4 === "function") {
                renderDevOnA4(ui.pagesContainer, pageNum, locked);
            }
        }

        if (typeof updateZoomUI === "function") updateZoomUI();
    }

    /**
     * --- 9. LOGIQUE DE DÉBORDEMENT (PAGE BREAK) ---
     * Découpe le texte intelligemment pour éviter que ça ne dépasse de la feuille.
     */
    function renderTextToPages(title, text, pageObj, onPageBreak) {
        const font = ui.fontSelect ? ui.fontSelect.value : "serif";
        const size = (ui.fontSizeInput ? ui.fontSizeInput.value : "12") + "px";
        const maxHeight = 940; // Hauteur maximale du contenu dans une page A4 (en px)

        if (title) {
            const header = document.createElement("div");
            header.className = "page-header-title";
            header.style.fontFamily = font;
            header.textContent = title;
            pageObj.content.appendChild(header);
        }

        if (!text) return;

        const paragraphs = text.split("\n");
        let currentPageArea = pageObj.content;
        let currentPageNum = 1;

        paragraphs.forEach(paraText => {
            if (!paraText.trim() && paraText !== "") return;

            const pDiv = document.createElement("div");
            pDiv.className = "text-paragraph";
            pDiv.style.fontFamily = font;
            pDiv.style.fontSize = size;
            currentPageArea.appendChild(pDiv);

            const words = paraText.split(" ");
            words.forEach(word => {
                const testText = pDiv.textContent;
                pDiv.textContent += (pDiv.textContent ? " " : "") + word;

                // Si le paragraphe dépasse la hauteur de la page
                if (currentPageArea.scrollHeight > maxHeight) {
                    pDiv.textContent = testText; // On retire le mot
                    currentPageNum++;
                    const newPage = onPageBreak(currentPageNum);
                    currentPageArea = newPage.content;
                    
                    // On crée un nouveau paragraphe sur la nouvelle page pour la suite
                    const newP = document.createElement("div");
                    newP.className = "text-paragraph";
                    newP.style.fontFamily = font;
                    newP.style.fontSize = size;
                    newP.textContent = word;
                    currentPageArea.appendChild(newP);
                }
            });
        });
    }

    /**
     * --- 10. CRÉATION PHYSIQUE DE LA PAGE ---
     * Structure HTML d'une feuille A4.
     */
    function createNewPage(num, container) {
        const wrapper = document.createElement("div");
        wrapper.className = "page-wrapper";
        wrapper.innerHTML = `
            <div class="preview-sheet">
                <div class="page-content"></div>
                <div class="page-footer">BuroMaster | Page ${num}</div>
            </div>`;

        const contentArea = wrapper.querySelector(".page-content");

        // Écouteur d'édition directe avec protection (Debounce)
        contentArea.addEventListener("input", () => {
            if (currentStep === "dev" || isLocked[currentStep]) return;
            
            // Mise à jour de la donnée source
            content[currentStep] = contentArea.innerText;
            
            // On attend que l'utilisateur arrête de taper pour recalculer les pages
            clearTimeout(editorPreviewTimer);
            editorPreviewTimer = setTimeout(() => {
                if (contentArea.scrollHeight > 940) {
                    updatePreview();
                }
                saveData();
            }, 1000);
        });

        container.appendChild(wrapper);
        return { wrapper, content: contentArea };
    }

      /**
     * --- 11. ANALYSEUR DE PLAN ROBUSTE ---
     * Transforme le texte brut du sommaire en structure hiérarchique.
     */
    function parsePlanForDev(planText) {
        if (!planText || typeof planText !== "string") return [];
        
        const sections = [];
        const lines = planText.split('\n');
        let currentSection = null;

        // Regex améliorées pour détecter : I. Titre, 1. Titre, A) Titre
        const sectionRegex = /^([IVX]+|[0-9]+)\s*[\.\-\)]\s*(.+)/i;
        const subpartRegex = /^([A-Z]|[a-z])\s*[\.\-\)]\s*(.+)/i;

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (!cleanLine || /^(introduction|conclusion|sommaire)/i.test(cleanLine)) return; 

            const sectionMatch = cleanLine.match(sectionRegex);
            if (sectionMatch) {
                currentSection = { 
                    fullTitle: cleanLine, 
                    titleOnly: sectionMatch[2].trim(),
                    subparts: [] 
                };
                sections.push(currentSection);
            } else if (subpartRegex.test(cleanLine) && currentSection) {
                currentSection.subparts.push(cleanLine);
            }
        });
        return sections;
    }

    /**
     * --- 12. GESTION DES BLOCS DE RÉDACTION (PANNEAU GAUCHE) ---
     */
    function setupDevBlocks() {
        if (!ui.devBlocksContainer) return;
        ui.devBlocksContainer.innerHTML = "";

        const sections = parsePlanForDev(content.plan || "");
        
        // 1. Vérification de cohérence entre le Plan et le Développement
        const planHasChanged = (content.plan.trim() !== lastSyncedPlan.trim());
        if (planHasChanged && lastSyncedPlan !== "" && !isLocked["dev"]) {
            renderSyncAlert(ui.devBlocksContainer);
        }

        if (sections.length === 0) {
            ui.devBlocksContainer.innerHTML = `
                <div class="empty-state-alert">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Aucune section détectée dans votre plan. <br>Format requis : "I. Titre"</p>
                </div>`;
            return;
        }

        // 2. Création des Textareas pour chaque section du plan
        sections.forEach(section => {
            const block = document.createElement("div");
            block.className = "dev-block-item";
            
            const savedValue = content.dev[section.fullTitle] || "";

            block.innerHTML = `
                <div class="dev-block-header">
                    <span class="section-badge">${section.fullTitle}</span>
                    <button class="ai-mini-gen" data-section="${section.fullTitle}" 
                            style="display: ${isLocked['dev'] ? 'none' : 'flex'}">
                        <i class="fas fa-magic"></i> IA
                    </button>
                </div>
                <textarea class="dev-textarea" 
                          placeholder="Développez la partie : ${section.titleOnly}..."
                          ${isLocked['dev'] ? 'disabled' : ''}>${savedValue}</textarea>
            `;

            ui.devBlocksContainer.appendChild(block);

            const textarea = block.querySelector(".dev-textarea");
            textarea.addEventListener("input", () => {
                content.dev[section.fullTitle] = textarea.value;
                schedulePreviewRefresh(800); // Rendu asynchrone pour fluidité
            });

            const aiBtn = block.querySelector(".ai-mini-gen");
            if (aiBtn) {
                aiBtn.onclick = () => handleSubGeneration(section.fullTitle, textarea, aiBtn);
            }
        });
    }

    /**
     * --- 13. MOTEUR DE RENDU SPÉCIFIQUE AU DÉVELOPPEMENT ---
     * Cette fonction répare l'erreur de "page blanche" en dessinant les blocs.
     */
    function renderDevOnA4(container, startPageNum, locked) {
        let currentPageNum = startPageNum;
        let currentFullPage = createNewPage(currentPageNum, container);
        const font = ui.fontSelect ? ui.fontSelect.value : "serif";
        const size = (ui.fontSizeInput ? ui.fontSizeInput.value : "12") + "px";
        const maxHeight = 930;

        const sections = parsePlanForDev(content.plan || "");
        
        sections.forEach((section) => {
            const textContent = content.dev[section.fullTitle] || "";
            
            // 1. Rendu du Titre de Section
            const h2 = document.createElement("h2");
            h2.className = "a4-section-title";
            h2.style.fontFamily = font;
            h2.textContent = section.fullTitle;
            currentFullPage.content.appendChild(h2);

            // 2. Rendu du contenu textuel avec gestion des sauts de page
            if (textContent) {
                const paragraphs = textContent.split("\n");
                paragraphs.forEach(para => {
                    const p = document.createElement("p");
                    p.className = "a4-paragraph";
                    p.style.fontFamily = font;
                    p.style.fontSize = size;
                    currentFullPage.content.appendChild(p);

                    const words = para.split(" ");
                    words.forEach(word => {
                        const oldText = p.textContent;
                        p.textContent += (p.textContent ? " " : "") + word;

                        if (currentFullPage.content.scrollHeight > maxHeight) {
                            p.textContent = oldText;
                            currentPageNum++;
                            currentFullPage = createNewPage(currentPageNum, container);
                            
                            // Nouveau paragraphe sur nouvelle page
                            const newP = document.createElement("p");
                            newP.className = "a4-paragraph";
                            newP.style.fontFamily = font;
                            newP.style.fontSize = size;
                            newP.textContent = word;
                            currentFullPage.content.appendChild(newP);
                        }
                    });
                });
            }
        });
    }

    /**
     * --- HELPER : ALERTE SYNCHRONISATION ---
     */
    function renderSyncAlert(container) {
        const alertDiv = document.createElement("div");
        alertDiv.className = "sync-warning-banner";
        alertDiv.innerHTML = `
            <span><i class="fas fa-sync"></i> Le plan a changé !</span>
            <button id="btnForceSync">Synchroniser les blocs</button>
        `;
        container.prepend(alertDiv);
        
        const btn = alertDiv.querySelector("#btnForceSync");
        btn.onclick = () => {
            if (typeof updateTitlesOnly === "function") updateTitlesOnly();
        };
    }

       /**
     * --- 14. LOGIQUE DE GÉNÉRATION IA (SÉCURISÉE) ---
     * Gère les appels API avec gestion d'erreurs et feedback visuel.
     */
    if (ui.generateBtn) {
        ui.generateBtn.addEventListener("click", async () => {
            const theme = ui.theme ? ui.theme.value.trim() : "";
            if (!theme) return showNotification("⚠️ Veuillez entrer un thème avant de solliciter l'IA.");

            // Sauvegarde l'état actuel avant modification par l'IA
            saveToHistory();

            const originalHTML = ui.generateBtn.innerHTML;
            ui.generateBtn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Rédaction en cours...";
            ui.generateBtn.disabled = true;

            const detailLevel = ui.aiDetailLevel ? ui.aiDetailLevel.value : "standard";
            const detailInstruction = {
                "concis": "brève et directe",
                "standard": "équilibrée et structurée",
                "detaille": "riche, approfondie et détaillée"
            }[detailLevel] || "standard";

            const prompt = `Agis en tant qu'expert académique. Rédige la section '${currentStep}' 
                           pour un exposé sur le thème : "${theme}". 
                           Public cible : Classe de ${ui.studentClass ? ui.studentClass.value : 'Scolaire'}. 
                           Style de rédaction : ${detailInstruction}. 
                           Réponds uniquement avec le contenu textuel, sans commentaires superflus.`;

            try {
                const result = await callAiAPI(prompt);
                if (result) {
                    content[currentStep] = result;
                    if (ui.editor && currentStep !== "dev") ui.editor.value = result;
                    refreshUIFromData();
                    saveData();
                    showNotification("Rédaction IA terminée avec succès ! ✨");
                } else {
                    showNotification("❌ L'IA n'a pas pu répondre. Vérifiez votre connexion.");
                }
            } catch (err) {
                console.error("Erreur critique IA:", err);
                showNotification("❌ Erreur technique lors de la génération.");
            } finally {
                ui.generateBtn.innerHTML = originalHTML;
                ui.generateBtn.disabled = false;
            }
        });
    }

    /**
     * --- 15. COMMUNICATION API ---
     * Sécurisé contre les erreurs de réseau.
     */
    async function callAiAPI(prompt) {
        try {
            // Utilisation d'un Timeout pour éviter les requêtes infinies
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s max

            const response = await fetch(`${window.location.origin}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();
            return data.text || null;
        } catch (err) {
            if (err.name === 'AbortError') console.error("Requête IA expirée.");
            else console.error("Erreur API:", err);
            return null;
        }
    }

    /**
     * --- 16. EXPORTS PDF & WORD (HAUTE FIDÉLITÉ) ---
     */
    if (ui.downloadBtn) {
        ui.downloadBtn.addEventListener("click", () => {
            const sheets = document.querySelectorAll(".preview-sheet");
            if (sheets.length === 0) return showNotification("L'exposé est vide.");

            // Vérification de la présence de la librairie html2pdf
            if (typeof html2pdf === "undefined") {
                return showNotification("❌ Librairie PDF manquante. Vérifiez votre connexion.");
            }

            const options = {
                margin: 0,
                filename: `BuroMaster_${ui.theme ? ui.theme.value.replace(/\s+/g, '_') : 'Expose'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
            };

            showNotification("Génération du PDF en cours... ⏳");
            html2pdf().set(options).from(ui.pagesContainer).save();
        });
    }

    window.exportToWord = function() {
        try {
            if (typeof htmlDocx === "undefined") {
                return showNotification("❌ Librairie Word manquante.");
            }
            let contentHtml = `
                <style>
                    body { font-family: 'Times New Roman', serif; }
                    .page-break { page-break-after: always; }
                </style>
            `;
            document.querySelectorAll(".page-content").forEach(p => {
                contentHtml += `<div>${p.innerHTML}</div><div class="page-break"></div>`;
            });

            const converted = htmlDocx.asBlob(`<!DOCTYPE html><html><body>${contentHtml}</body></html>`);
            const url = URL.createObjectURL(converted);
            const link = document.createElement("a");
            link.href = url;
            link.download = `BuroMaster_${ui.theme ? ui.theme.value : 'Document'}.docx`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (err) {
            console.error("Erreur Export Word:", err);
            showNotification("❌ Échec de l'export Word.");
        }
    };

    /**
     * --- 17. ZOOM, NOTIFICATIONS ET CLEANUP ---
     */
    window.updateZoomUI = function() {
        if (!ui.zoomLevelSpan) return;
        const sheets = document.querySelectorAll(".preview-sheet");
        sheets.forEach(sheet => {
            sheet.style.transform = `scale(${currentZoom})`;
            sheet.style.transformOrigin = "top center";
            // Ajustement de la marge du conteneur pour compenser le zoom
            sheet.parentElement.style.height = (1123 * currentZoom) + "px";
        });
        ui.zoomLevelSpan.textContent = `${Math.round(currentZoom * 100)}%`;
    };

    if (ui.zoomInBtn) ui.zoomInBtn.onclick = () => { if (currentZoom < 1.5) { currentZoom += 0.1; updateZoomUI(); } };
    if (ui.zoomOutBtn) ui.zoomOutBtn.onclick = () => { if (currentZoom > 0.3) { currentZoom -= 0.1; updateZoomUI(); } };

    function showNotification(msg) {
        const toast = document.createElement("div");
        toast.className = "toast-notification"; 
        toast.innerHTML = msg;
        document.body.appendChild(toast);
        // Animation simple de sortie
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }

    /**
     * --- 18. INITIALISATION FINALE ---
     */
    if (ui.validateBtn) {
        ui.validateBtn.onclick = () => {
            saveToHistory();
            isLocked[currentStep] = !isLocked[currentStep];
            if (isLocked[currentStep]) {
                reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
            }
            goToStep(currentStep);
            showNotification(isLocked[currentStep] ? "Étape validée 🔒" : "Édition autorisée 🔓");
        };
    }

    if (ui.resetAllBtn) {
        ui.resetAllBtn.onclick = () => {
            if (confirm("⚠️ ATTENTION : Cela supprimera tout votre travail actuel. Continuer ?")) {
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                window.location.reload();
            }
        };
    }

    // LANCEMENT SÉCURISÉ
    try {
        const startStep = loadData();
        // On initialise d'abord les éléments d'interface
        updateHistoryButtons();
        // On lance la navigation
        goToStep(startStep);
    } catch (err) {
        console.error("Erreur fatale au démarrage:", err);
        showNotification("⚠️ Erreur lors du chargement de l'application.");
    }

}); // FIN DU SCRIPT DOMContentLoaded
 
