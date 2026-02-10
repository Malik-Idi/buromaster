document.addEventListener("DOMContentLoaded", function () {
    // --- 1. SÉLECTION DES ÉLÉMENTS DU DOM ---
    // On lie le JavaScript aux IDs que nous avons mis dans le nouveau HTML
    const editor = document.getElementById("editor"); // Notre tampon invisible
    const themeInput = document.getElementById("theme");
    const studentClassInput = document.getElementById("studentClass");
    const pagesContainer = document.getElementById("preview-pages"); // La zone A4
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
    
    const advancedOptionsBtn = document.getElementById("advancedOptionsBtn");
    const advancedPanel = document.getElementById("advancedPanel");
    const fontSelect = document.getElementById("fontSelect");
    const fontSizeInput = document.getElementById("fontSizeInput");
    const aiDetailLevel = document.getElementById("aiDetailLevel");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const zoomLevelSpan = document.getElementById("zoomLevel");
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");

    // --- 2. ÉTAT DE L'APPLICATION ---
    let currentStep = "plan"; 
    const stepsOrder = ["plan", "intro", "dev", "conclu"];
    let content = { plan: "", intro: "", dev: {}, conclu: "" };
    let isLocked = { plan: false, intro: false, dev: false, conclu: false };
    let reachedStepIndex = 0;
    let currentZoom = 0.6; // 60% pour voir la page entière
    let editorPreviewTimer = null;
    let lastSyncedPlan = ""; 

    // --- 3. GESTION DE L'HISTORIQUE (UNDO/REDO) ---
let historyStack = [];
let redoStack = [];

function saveToHistory() {
    if (historyStack.length > 25) historyStack.shift();

    // Sauvegarde profonde pour éviter les références
    const snapshot = JSON.parse(JSON.stringify(content));
    historyStack.push(snapshot);

    redoStack = [];
    updateHistoryButtons();
}

function undo() {
    if (historyStack.length === 0) return;

    // Sauvegarde actuelle dans redo
    redoStack.push(JSON.parse(JSON.stringify(content)));

    // Récupère la dernière version
    content = historyStack.pop();

    // Mise à jour de l'UI
    refreshUIFromData();
    updateDevBlocksFromContent(); // synchronise les textarea dev
    showNotification("Action annulée ↩️");
}

function redo() {
    if (redoStack.length === 0) return;

    historyStack.push(JSON.parse(JSON.stringify(content)));
    content = redoStack.pop();

    refreshUIFromData();
    updateDevBlocksFromContent(); // synchronise les textarea dev
    showNotification("Action rétablie ↪️");
}

function updateHistoryButtons() {
    if (undoBtn) undoBtn.disabled = historyStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;

    if (undoBtn) undoBtn.style.opacity = undoBtn.disabled ? "0.3" : "1";
    if (redoBtn) redoBtn.style.opacity = redoBtn.disabled ? "0.3" : "1";
}

// --- Fonction helper pour remettre les contenus des blocs de développement ---
function updateDevBlocksFromContent() {
    if (currentStep !== "dev") return;

    const container = document.getElementById("dev-blocks-container");
    if (!container) return;

    container.querySelectorAll(".sub-editor").forEach(textarea => {
        const parent = textarea.closest(".dev-block");
        if (!parent) return;
        const title = parent.dataset.sectionTitle;
        textarea.value = content.dev[title] || "";
    });

    setupDevBlocks(); // réaffiche les boutons IA correctement
}

    // --- 4. SAUVEGARDE LOCALE (LOCALSTORAGE) ---
    // Permet de retrouver son travail après avoir fermé le navigateur
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
            lastUpdate: Date.now()
        };
        localStorage.setItem("buroMaster_premium_save", JSON.stringify(snapshot));
    }

    // --- 5. FONCTION DE CHARGEMENT ---
    function loadData() {
        try {
            const saved = localStorage.getItem("buroMaster_premium_save");
            if (saved) {
                const data = JSON.parse(saved);
                
                // Sécurité BuroMaster : Nettoyage après 12h pour ne pas encombrer le navigateur
                const douzeHeuresEnMs = 12 * 60 * 60 * 1000;
                const tempsEcoule = Date.now() - (data.lastUpdate || 0);

                if (tempsEcoule > douzeHeuresEnMs) {
                    localStorage.removeItem("buroMaster_premium_save");
                    return "plan"; 
                }

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
    function refreshUIFromData() {
        if (currentStep === "dev") {
            setupDevBlocks(); 
        } else {
            // On met à jour notre tampon invisible
            editor.value = content[currentStep] || "";
        }
        updatePreview(); 
        updateHistoryButtons();
    }

    // --- 7. NAVIGATION ENTRE LES ÉTAPES ---
    function goToStep(step) {
        clearTimeout(editorPreviewTimer);

        // Sauvegarde du texte actuel avant de changer
        if (currentStep !== "dev") {
            content[currentStep] = editor.value;
        }

        currentStep = step;

        const stepNames = { plan: "Plan", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
        stepTitle.textContent = "Édition : " + (stepNames[step] || step);
        
        const locked = isLocked[step];

        // LOGIQUE ÉDITION DIRECTE : 
        // On prépare la feuille A4 pour être éditable ou non selon le verrouillage
        updatePreview(); 

        // Configuration des boutons de la barre latérale
        validateBtn.textContent = locked ? "Modifier cette étape" : "Valider cette étape";
        validateBtn.style.background = locked ? "#f59e0b" : "#10b981"; // Orange vs Vert

        // Gestion du bouton "Suivant" ou "Exporter Word"
        if (step === "conclu" && locked) {
            nextStepBtn.textContent = "Exporter en Word (.doc)";
            nextStepBtn.style.display = "block";
            nextStepBtn.classList.add("is-word-btn");
        } else {
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

        // Le bouton IA ne s'affiche que si l'étape n'est pas verrouillée
        generateBtn.style.display = (!locked && step !== "dev") ? "block" : "none";

        // Bascule entre les blocs de développement (Étape 3) et le reste
        if (step === "dev") {
            document.getElementById("dev-blocks-container").style.display = "block";
            setupDevBlocks(); 
        } else {
            document.getElementById("dev-blocks-container").style.display = "none";
        }

        updateHeaderUI(); 
        saveData(); 
    }
    function updateHeaderUI() {
        document.querySelectorAll(".step-link").forEach((link, index) => {
            const stepName = stepsOrder[index];
            link.classList.remove("active", "unlocked");
            
            const labels = { plan: "Plan", intro: "Intro", dev: "Corps", conclu: "Fin" };
            let text = labels[stepName];
            
            // Icône de cadenas dynamique
            if (isLocked[stepName]) {
                link.innerHTML = `<i class="fas fa-lock" style="font-size:0.7rem"></i> ${text}`;
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

    // --- 8. MOTEUR DE RENDU (DESSIN ET ÉDITION DIRECTE) ---
    function updatePreview() {
        if (!pagesContainer) return;
        pagesContainer.innerHTML = ""; 
        let pageNum = 1;

        // On boucle sur les étapes pour construire l'aperçu complet
        // 1. Sommaire, 2. Intro, 3. Développement, 4. Conclusion
        
        // --- LOGIQUE ÉDITION DIRECTE ---
        // On crée la première page pour l'étape actuelle
        let currentPageObj = createNewPage(pageNum, pagesContainer);
        
        // On rend la zone éditable seulement si l'étape n'est pas verrouillée
        const contentArea = currentPageObj.content;
        const locked = isLocked[currentStep];
        contentArea.contentEditable = !locked;
        contentArea.style.cursor = locked ? "not-allowed" : "text";
        contentArea.style.color = locked ? "#64748b" : "black";

        // On dessine le contenu de l'étape actuelle sur les pages
        if (currentStep !== "dev") {
            const titleNames = { plan: "SOMMAIRE", intro: "INTRODUCTION", conclu: "CONCLUSION" };
            renderSection(titleNames[currentStep], content[currentStep], currentPageObj.content, () => { 
                pageNum++; 
                currentPageObj = createNewPage(pageNum, pagesContainer);
                currentPageObj.content.contentEditable = !locked;
                return currentPageObj.content;
            });
        } else {
            // Cas spécial pour le Développement (multi-blocs)
            renderDevOnA4(pagesContainer, pageNum, locked);
        }

        updateZoomUI();
    }

    // --- 9. DESSIN DES SECTIONS ET DÉTECTION DÉBORDEMENT ---
    function renderSection(title, text, pageElement, onBreak) {
        const isAutoFormat = autoFormatCheckbox.checked;
        const selectedFont = fontSelect.value;
        const selectedSize = fontSizeInput.value + "px";
        const limitHeight = 910; // Limite de hauteur en pixels pour un A4 (environ 297mm)

        if (title) {
            const t = document.createElement("div");
            t.className = "page-header"; // Utilise le style élégant défini en CSS
            t.style.fontFamily = selectedFont;
            t.textContent = title;
            pageElement.parentNode.insertBefore(t, pageElement); // Place le titre en haut de page
        }

        if (!text) return pageElement;

        const paragraphs = text.split("\n");
        for (let p = 0; p < paragraphs.length; p++) {
            const paragraphText = paragraphs[p];
            let div = document.createElement("div");
            div.style.fontFamily = selectedFont;
            div.style.fontSize = selectedSize;
            div.className = "text-style";

            // Formatage IA automatique pendant le rendu
            if (isAutoFormat) {
                if (/^([IVX]+|[0-9]+)\s*[\.\-\)]/.test(paragraphText)) {
                    div.style.fontWeight = "bold";
                    div.style.color = "var(--brand-dark)";
                } else if (/^([A-Z]|[a-z])\s*[\.\-\)]/.test(paragraphText)) {
                    div.style.marginLeft = "20px";
                }
            }

            pageElement.appendChild(div);

            // Découpage par mots pour gérer le saut de page
            const words = paragraphText.split(" ");
            words.forEach((word, w) => {
                const prev = div.textContent;
                div.textContent += (w === 0 ? "" : " ") + word;

                if (pageElement.scrollHeight > limitHeight) {
                    div.textContent = prev; // On retire le mot qui déborde
                    pageElement = onBreak(); // On change de page
                    let newDiv = document.createElement("div");
                    newDiv.style.fontFamily = selectedFont;
                    newDiv.style.fontSize = selectedSize;
                    newDiv.className = div.className;
                    pageElement.appendChild(newDiv);
                    div = newDiv;
                    div.textContent = word;
                }
            });
        }
        return pageElement;
    }

    // --- 10. CRÉATION PHYSIQUE DES PAGES A4 ---
let typingTimer; // Timer pour le debounce

function createNewPage(num, container) {
    const wrapper = document.createElement("div");
    wrapper.className = "page-wrapper";
    wrapper.innerHTML = `
        <div class="preview-sheet">
            <div class="page-content"></div>
            <div class="page-footer">BuroMaster | Page ${num}</div>
        </div>`;

    const contentArea = wrapper.querySelector(".page-content");

    contentArea.addEventListener("input", () => {
        if (currentStep === "dev") return;

        content[currentStep] = contentArea.innerText;
        saveData();

        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if (contentArea.scrollHeight > 920) {
                // Sauvegarde du scroll actuel **en prenant en compte le zoom**
                const scrollRatio = container.scrollTop / container.scrollHeight;

                updatePreview();

                // Restoration du scroll après mise à jour
                requestAnimationFrame(() => {
                    container.scrollTop = scrollRatio * container.scrollHeight;
                });

                showNotification("Nouvelle page créée 📄");
            }
        }, 1500);
    });

    container.appendChild(wrapper);
    updateZoomUI(); // applique le zoom à la nouvelle page
    return { wrapper, content: contentArea };
}

    // --- 11. ANALYSEUR DE PLAN (EXTRACTION DES TITRES) ---
    // Cette fonction transforme ton texte de plan en une liste d'objets utilisables
    function parsePlanForDev(planText) {
        const sections = [];
        const lines = planText.split('\n');
        let currentSection = null;

        // Expressions régulières pour détecter les formats (I., A., 1., etc.)
        const sectionRegex = /^([IVX]+|[0-9]+)\s*[\.\-\)]\s+/;
        const subpartRegex = /^([A-Z]|[a-z])\s*[\.\-\)]\s+/;

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (!cleanLine || /^(introduction|conclusion)$/i.test(cleanLine)) return; 

            if (sectionRegex.test(cleanLine)) {
                currentSection = { title: cleanLine, subparts: [] };
                sections.push(currentSection);
            } else if (subpartRegex.test(cleanLine) && currentSection) {
                currentSection.subparts.push(cleanLine);
            }
        });
        return sections;
    }

    // --- 12. GESTION DES BLOCS DE DÉVELOPPEMENT (À GAUCHE) ---
    function setupDevBlocks() {
        const container = document.getElementById("dev-blocks-container");
        if (!container) return;
        container.innerHTML = "";

        // Bouton de synchronisation si le plan a changé
const planHasChanged = (content.plan.trim() !== lastSyncedPlan.trim());
if (planHasChanged && lastSyncedPlan !== "") {
    const syncBtn = document.createElement("button");
    syncBtn.className = "ai-generate-btn"; // Même style que le bouton IA
    syncBtn.style.background = "var(--success)";
    syncBtn.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> Plan modifié ! Synchroniser ?`;
    container.appendChild(syncBtn);

    syncBtn.addEventListener("click", () => {
        const modal = document.getElementById("syncModal");
        if (!modal) return;

        modal.style.display = "flex";

        // Boutons internes du modal
        const btnTitles = document.getElementById("btnSyncTitles");
        const btnAll = document.getElementById("btnSyncAll");
        const btnCancel = document.getElementById("btnCancelSync");

        if (btnTitles) btnTitles.onclick = () => {
            updateTitlesOnly();   // garde les textes existants
            modal.style.display = "none";
            lastSyncedPlan = content.plan; // mise à jour du plan synchronisé
            showNotification("Titres synchronisés ✅");
        };

        if (btnAll) btnAll.onclick = () => {
            content.dev = {}; // réinitialise tous les blocs
            lastSyncedPlan = content.plan;
            setupDevBlocks();
            updatePreview();
            modal.style.display = "none";
            showNotification("Tout réinitialisé et synchronisé ✅");
        };

        if (btnCancel) btnCancel.onclick = () => {
            modal.style.display = "none";
            showNotification("Action annulée ❌");
        };
    });
}

        const sections = parsePlanForDev(content.plan || "");
        if (sections.length === 0) {
            container.innerHTML += `<p style="color:var(--brand); font-size:0.8rem; text-align:center; padding:20px;">
                <i class="fas fa-info-circle"></i> Validez d'abord un plan pour générer les blocs ici.
            </p>`;
            return;
        }

        sections.forEach(section => {
            const block = document.createElement("div");
            block.className = "dev-block";
            block.dataset.sectionTitle = section.title; 

            block.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:0.8rem; color:var(--brand);">${section.title}</strong>
                    <button class="generate-sub-btn" style="display: ${isLocked['dev'] ? 'none' : 'block'}">
                        <i class="fas fa-robot"></i> IA
                    </button>
                </div>
                <textarea class="sub-editor" placeholder="Rédigez cette partie...">${content.dev[section.title] || ""}</textarea>
            `;
            container.appendChild(block);

            const textarea = block.querySelector(".sub-editor");
            const aiBtn = block.querySelector(".generate-sub-btn");

            // Quand on écrit dans un bloc, ça met à jour la mémoire et la feuille A4
            textarea.addEventListener("input", () => {
                content.dev[section.title] = textarea.value;
                schedulePreviewRefresh(500);
            });

            if (aiBtn) {
                aiBtn.addEventListener("click", () => handleSubGeneration(block, textarea, aiBtn));
            }
        });
    }

    // --- 13. SYNCHRONISATION INTELLIGENTE DES TITRES ---
    function updateTitlesOnly() {
        const newSections = parsePlanForDev(content.plan || "");
        const oldContentDev = { ...content.dev };
        const newContentDev = {};
        const oldTitles = Object.keys(oldContentDev);

        newSections.forEach((section, index) => {
            const newTitle = section.title;
            // On essaie de récupérer le texte par le nom exact ou par la position
            if (oldContentDev[newTitle] !== undefined) {
                newContentDev[newTitle] = oldContentDev[newTitle];
            } else if (oldTitles[index] !== undefined) {
                newContentDev[newTitle] = oldContentDev[oldTitles[index]];
            } else {
                newContentDev[newTitle] = "";
            }
        });

        content.dev = newContentDev;
        lastSyncedPlan = content.plan;
        setupDevBlocks();
        updatePreview();
        showNotification("Structure mise à jour ! ✅");
    }
    // --- 14. LOGIQUE DE GÉNÉRATION IA ---
    if (generateBtn) {
        generateBtn.addEventListener("click", async () => {
            const theme = themeInput.value.trim();
            if (!theme) return showNotification("⚠️ Entrez un thème d'abord.");

            saveToHistory();
            const originalBtnHTML = generateBtn.innerHTML;
            generateBtn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Rédaction...";
            generateBtn.disabled = true;

            const detailInstruction = {
                "concis": "brève et directe",
                "standard": "équilibrée et scolaire",
                "detaille": "très riche et approfondie"
            }[aiDetailLevel.value];

            let prompt = `Agis comme un expert scolaire. Rédige le/la ${currentStep} pour un exposé sur : "${theme}". 
                         Niveau : ${studentClassInput.value || 'scolaire'}. Longueur : ${detailInstruction}.`;

            const result = await callAiAPI(prompt);
            if (result) {
                content[currentStep] = result;
                refreshUIFromData();
                saveData();
                showNotification("IA : Rédaction terminée ! ✨");
            }
            generateBtn.innerHTML = originalBtnHTML;
            generateBtn.disabled = false;
        });
    }

    async function callAiAPI(prompt) {
        try {
            // On utilise l'URL relative pour pointer vers ton dossier /api/ sur GitHub
            const response = await fetch(`${window.location.origin}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });
            const data = await response.json();
            return data.text || null;
        } catch (err) {
            console.error("Erreur API:", err);
            return null;
        }
    }

    // --- 15. EXPORT PDF ET WORD ---
    downloadBtn.addEventListener("click", () => {
        const sheets = document.querySelectorAll(".preview-sheet");
        if (sheets.length === 0) return showNotification("L'exposé est vide.");

        const options = {
            margin: 0,
            filename: `BuroMaster_${themeInput.value || 'Expose'}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        };
        html2pdf().set(options).from(pagesContainer).save();
    });

    function exportToWord() {
        let contentHtml = "";
        document.querySelectorAll(".preview-sheet").forEach(s => {
            contentHtml += s.innerHTML + '<br style="page-break-after: always;">';
        });
        const converted = htmlDocx.asBlob(`<!DOCTYPE html><html><body>${contentHtml}</body></html>`);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(converted);
        link.download = `BuroMaster_${themeInput.value || 'Expose'}.docx`;
        link.click();
    }

    // --- 16. GESTION DU ZOOM ET NOTIFICATIONS ---
    function updateZoomUI() {
        const sheets = document.querySelectorAll(".preview-sheet");
        sheets.forEach(sheet => {
            sheet.style.transform = `scale(${currentZoom})`;
            sheet.style.transformOrigin = "top center";
        });
        if (zoomLevelSpan) zoomLevelSpan.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    if (zoomInBtn) zoomInBtn.onclick = () => { if (currentZoom < 1.3) { currentZoom += 0.1; updateZoomUI(); } };
    if (zoomOutBtn) zoomOutBtn.onclick = () => { if (currentZoom > 0.4) { currentZoom -= 0.1; updateZoomUI(); } };

    function showNotification(msg) {
        const toast = document.createElement("div");
        toast.className = "toast-notification";
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // --- 17. INITIALISATION FINALE ---
    validateBtn.addEventListener("click", () => {
        isLocked[currentStep] = !isLocked[currentStep];
        if (isLocked[currentStep]) reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
        goToStep(currentStep);
    });

    if (resetAllBtn) {
        resetAllBtn.onclick = () => {
            if (confirm("⚠️ Tout effacer ?")) {
                localStorage.removeItem("buroMaster_premium_save");
                window.location.reload();
            }
        };
    }

    // Lancement
    const startStep = loadData();
    goToStep(startStep);
    refreshUIFromData();
}); // FIN DU SCRIPT
