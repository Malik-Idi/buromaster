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

    // --- 7. NAVIGATION ENTRE LES ÉTAPES ---
    function goToStep(step) {
        // Sauvegarde automatique de l'étape actuelle avant de changer
        if (currentStep !== "dev") {
            content[currentStep] = editor.value;
        }

        currentStep = step; // Mise à jour de l'étape active

        // Mise à jour visuelle du titre (ex: Édition du Plan)
        const stepNames = { plan: "Plan", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
        stepTitle.textContent = "Édition : " + (stepNames[step] || step);
        
        const locked = isLocked[step];

        // Adaptation du bouton Valider/Modifier
        validateBtn.textContent = locked ? "Modifier cette étape" : "Valider cette étape";
        validateBtn.style.background = locked ? "#ff9800" : "#0aa64b";

        // Logique du bouton "Suivant" et "Word"
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

        // Affichage ou non de l'IA (On ne génère pas si c'est verrouillé)
        generateBtn.style.display = (!locked && step !== "dev") ? "block" : "none";

        // Bascule Editeur Classique vs Blocs de Développement
        if (step === "dev") {
            editor.style.display = "none";
            document.getElementById("dev-blocks-container").style.display = "block";
            setupDevBlocks(); 
        } else {
            editor.style.display = "block";
            editor.value = content[step] || "";
            document.getElementById("dev-blocks-container").style.display = "none";
        }

        updateHeaderUI(); // Mise à jour des couleurs des onglets en haut
        saveData(); 
    }

    function updateHeaderUI() {
        document.querySelectorAll(".step-link").forEach((link, index) => {
            const stepName = stepsOrder[index];
            link.classList.remove("active", "unlocked");
            
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
            // Avant de verrouiller, on enregistre une photo pour le Undo
            saveToHistory();
            
            if (currentStep !== "dev") {
                content[currentStep] = editor.value;
            }
            isLocked[currentStep] = true;
            // On débloque l'étape suivante dans le menu
            reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
        } else {
            // Si on déverrouille pour modifier
            isLocked[currentStep] = false;
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
            // On ignore les lignes vides et les titres Intro/Conclu qui ont leurs propres étapes
            if (!cleanLine || /intro/i.test(cleanLine) || /conclu/i.test(cleanLine)) return; 

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
        
        // On vide proprement sans perdre les écouteurs si besoin (ici on recrée tout)
        container.innerHTML = "";

        const sections = parsePlanForDev(content.plan || "");

        if (sections.length === 0) {
            container.innerHTML = "<p style='color:red; padding:20px;'>Aucune section (I, II, III...) détectée dans votre plan. Revenez à l'étape Plan.</p>";
            return;
        }

        sections.forEach((section, index) => {
            const block = document.createElement("div");
            block.className = "dev-block";
            block.dataset.sectionTitle = section.title;

            // On ajoute l'icône robot (fas fa-robot) dans le bouton
            block.innerHTML = `
                <div class="block-header">
                    <strong style="color: var(--primary-color); font-size: 1.1em;">${section.title}</strong>
                    <button class="generate-sub-btn" ${isLocked['dev'] ? 'style="display:none"' : ''}>
                        <i class="fas fa-robot"></i> Développer avec l'IA
                    </button>
                </div>
                <div style="font-size:0.85em; color:#777; margin-bottom:12px; font-style: italic;">
                    Sujets abordés : ${section.subparts.join(" • ")}
                </div>
                <textarea class="sub-editor" placeholder="Développez cette partie ou laissez l'IA le faire..." ${isLocked['dev'] ? 'readonly' : ''}>${content.dev[section.title] || ""}</textarea>
            `;

            container.appendChild(block);

            // Événements du bloc
            const textarea = block.querySelector(".sub-editor");
            const aiBtn = block.querySelector(".generate-sub-btn");

            // Sauvegarde en temps réel pendant la frappe
            textarea.addEventListener("input", (e) => {
                content.dev[section.title] = e.target.value;
                // On utilise un petit délai pour ne pas saturer l'aperçu (Debounce léger)
                clearTimeout(textarea.timer);
                textarea.timer = setTimeout(() => {
                    updatePreview();
                    saveData();
                }, 500);
            });

            aiBtn.addEventListener("click", () => handleSubGeneration(block, textarea, aiBtn));
        });
    }

        // --- 11. GESTION DU ZOOM ---
    function updateZoomUI() {
        const sheets = document.querySelectorAll(".preview-sheet");
        sheets.forEach(sheet => {
            // Applique le facteur d'échelle
            sheet.style.transform = `scale(${currentZoom})`;
            
            // Correction dynamique de la marge pour éviter les trous blancs
            // Plus on dézoome, plus on réduit l'espace fantôme
            const marginValue = -297 * (1 - currentZoom); 
            sheet.style.marginBottom = `${marginValue}mm`;
        });
        zoomLevelSpan.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    zoomInBtn.addEventListener("click", () => {
        if (currentZoom < 1.5) { // Max 150%
            currentZoom += 0.1;
            updateZoomUI();
        }
    });

    zoomOutBtn.addEventListener("click", () => {
        if (currentZoom > 0.4) { // Min 40%
            currentZoom -= 0.1;
            updateZoomUI();
        }
    });

    // --- 12. MOTEUR DE RENDU DES PAGES (PAGINATION) ---
    function updatePreview() {
        if (!pagesContainer) return;
        
        const fragment = document.createDocumentFragment();
        pagesContainer.innerHTML = ""; 
        
        let pageNum = 1;
        // Création de la première page
        let currentPageContent = createNewPage(pageNum, fragment);

        // 1. Rendu du Sommaire (Plan)
        if (content.plan) {
            currentPageContent = renderSection("SOMMAIRE", content.plan, currentPageContent, () => { 
                pageNum++; return createNewPage(pageNum, fragment);
            });
        }

        // 2. Rendu de l'Introduction
        if (content.intro) {
            pageNum++; 
            currentPageContent = createNewPage(pageNum, fragment);
            currentPageContent = renderSection("INTRODUCTION", content.intro, currentPageContent, () => { 
                pageNum++; return createNewPage(pageNum, fragment);
            });
        }

        // 3. Rendu du Développement (Bloc par bloc)
        const devSections = parsePlanForDev(content.plan || "");
        const hasDev = Object.keys(content.dev).length > 0;
        if (hasDev) {
            pageNum++; 
            currentPageContent = createNewPage(pageNum, fragment);
            
            // Titre principal du développement
            const devTitle = document.createElement("div");
            devTitle.className = "title-style";
            devTitle.style.textAlign = "center";
            devTitle.textContent = "DÉVELOPPEMENT";
            currentPageContent.appendChild(devTitle);

            const orderedDevTitles = devSections.length
                ? devSections.map((section) => section.title)
                : Object.keys(content.dev);

            orderedDevTitles.forEach((sectionTitle) => {
                if (!content.dev[sectionTitle]) return;
                currentPageContent = renderSection(sectionTitle, content.dev[sectionTitle], currentPageContent, () => {
                    pageNum++; return createNewPage(pageNum, fragment);
                });
            });
        }

        // 4. Rendu de la Conclusion
        if (content.conclu) {
            pageNum++; 
            currentPageContent = createNewPage(pageNum, fragment);
            currentPageContent = renderSection("CONCLUSION", content.conclu, currentPageContent, () => { 
                pageNum++; return createNewPage(pageNum, fragment);
            });
        }

        pagesContainer.appendChild(fragment);
        updateZoomUI(); // Applique le zoom aux nouvelles pages créées
    }

        // --- 13. LOGIQUE DE SAUT DE PAGE (VERSION FINALE CORRIGÉE) ---
    function getAvailablePageHeight() {
        /**
         * Une feuille A4 fait 1122px (à 96dpi).
         * On retire le padding (20mm + 20mm = env. 150px)
         * On retire la place pour le header et le footer.
         * 900px est la limite de sécurité pour déclencher le saut de page.
         */
        return 900; 
    }

    function renderSection(title, text, pageElement, onBreak) {
        const isAutoFormat = autoFormatCheckbox.checked;
        const selectedFont = fontSelect.value;
        const selectedSize = fontSizeInput.value + "px";

        // Ajout du titre de section (ex: SOMMAIRE, INTRODUCTION...)
        if (title) {
            const t = document.createElement("div");
            t.className = "title-style";
            t.style.fontFamily = selectedFont;
            t.style.fontSize = (parseInt(fontSizeInput.value) + 2) + "px"; // Titre légèrement plus grand
            t.style.fontWeight = "bold";
            t.textContent = title.toUpperCase();
            pageElement.appendChild(t);
        }

        const lines = text.split("\n");
        for (let line of lines) {
            const div = document.createElement("div");
            div.style.fontFamily = selectedFont;
            div.style.fontSize = selectedSize;
            
            // Application de la mise en forme automatique selon tes Regex
            if (isAutoFormat) {
                if (/^(introduction|conclusion)\b/i.test(line)) {
                    div.className = "intro-conclu-style";
                } else if (/^([IVX]+|[0-9]+)\s*[\.\-\)]/.test(line)) {
                    div.className = "title-style";
                    div.style.fontWeight = "bold";
                } else if (/^([A-Z]|[a-z])\s*[\.\-\)]/.test(line)) {
                    div.className = "subtitle-style";
                    div.style.fontWeight = "bold";
                } else if (/^([0-9]+(?:\.[0-9]+)+)\s*/.test(line)) {
                    div.className = "subtitle-style";
                    div.style.fontWeight = "bold";
                } else {
                    div.className = "text-style";
                }
            } else {
                div.className = "text-style";
            }

            // Gestion des lignes vides pour garder l'espacement
            div.textContent = line.trim() === "" ? "\u00A0" : line;
            pageElement.appendChild(div);

            // --- CORRECTION : Détection immédiate du débordement ---
            if (pageElement.offsetHeight > 880) { // On utilise une marge de sécurité à 880px
                pageElement.removeChild(div);
                // On appelle onBreak() qui va créer une nouvelle page et retourner son nouveau container
                pageElement = onBreak(); 
                pageElement.appendChild(div);
            }
        }
        return pageElement;
    }

    function createNewPage(num, container) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        
        const currentTheme = themeInput.value || "MON EXPOSÉ";
        const studentClass = studentClassInput.value ? ` | ${studentClassInput.value}` : "";

        /**
         * Structure HTML interne :
         * Le CSS (Flexbox) s'occupera d'espacer le header, le contenu et le footer.
         * Le footer est fixé en bas grâce à position: absolute dans le CSS.
         */
        page.innerHTML = `
            <div class="page-header">${currentTheme}${studentClass}</div>
            <div class="page-content"></div>
            <div class="page-footer">Page ${num}</div>
        `;
        
        container.appendChild(page);
        
        // On retourne la zone "page-content" pour que renderSection puisse y écrire
        return page.querySelector(".page-content");
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

    // --- 15. DÉVELOPPEMENT DES SOUS-PARTIES ---
    async function handleSubGeneration(block, textarea, button) {
        const theme = themeInput.value.trim();
        const studentClass = studentClassInput.value.trim() || "scolaire";
        const sectionData = JSON.parse(JSON.stringify(block.dataset.sectionTitle)); 
        const detailLevel = aiDetailLevel.value;

        if (!theme) {
            alert("Veuillez entrer un thème.");
            return;
        }

        saveToHistory(); // Sauvegarde pour Undo
        const originalBtnText = button.innerHTML;
        button.innerHTML = "<i class='fas fa-spinner fa-spin'></i>"; 
        button.disabled = true;
        textarea.value = "L'IA analyse le plan et développe...";
       
        const prompt = `Développe la partie suivante d'un exposé sur "${theme}".
            Niveau de la classe : ${studentClass}.
            TITRE À DÉVELOPPER : ${sectionData}.
            Niveau de détail : ${detailLevel}.
            CONSIGNES : Rédige des paragraphes fluides. Ne répète pas les titres.`;
       
        const result = await callAiAPI(prompt);
        
        textarea.value = result;
        content.dev[sectionData] = result;
        
        button.innerHTML = originalBtnText;
        button.disabled = false;
        
        updatePreview();
        saveData();
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

    // --- 18. EXPORT PDF HAUTE QUALITÉ (HD) ---
    downloadBtn.addEventListener("click", () => {
        const element = document.getElementById("preview-pages");
        if (!element || !element.innerHTML.trim()) {
            alert("L'exposé est vide.");
            return;
        }

        // ÉTAPE CRUCIALE : On force le zoom à 100% pour la capture HD
        const originalZoom = currentZoom;
        currentZoom = 1.0;
        updateZoomUI();

        const themeFileName = themeInput.value.replace(/[^a-z0-9]/gi, '_') || "Expose";
        
        const options = {
            margin: 0,
            filename: `BuroMaster_${themeFileName}.pdf`,
            image: { type: "jpeg", quality: 1.0 }, // Qualité maximale
            html2canvas: { 
                scale: 3, // Résolution Retina (très net)
                useCORS: true, 
                letterRendering: true 
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["css", "after"], after: ".preview-sheet" }
        };

        // Lancement de la génération
        html2pdf().set(options).from(element).save().then(() => {
            // Après l'export, on remet le zoom de l'utilisateur
            currentZoom = originalZoom;
            updateZoomUI();
        });
    });

    // --- 19. EXPORT WORD ET NAVIGATION ---
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
        if (!element || !element.innerHTML.trim()) {
            alert("L'exposé est vide.");
            return;
        }

        if (typeof htmlDocx === "undefined") {
            alert("Erreur Word : bibliothèque html-docx non chargée.");
            return;
        }

        const contentHtml = element.innerHTML;
        const styles = `
            <style>
                body { font-family: "Times New Roman", serif; }
                .preview-sheet { width: 210mm; min-height: 297mm; padding: 20mm; }
                .page-header { text-align: center; font-weight: bold; margin-bottom: 10px; }
                .page-footer { text-align: center; margin-top: 10px; }
                .title-style { font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
                .subtitle-style { font-weight: bold; margin-bottom: 8px; }
                .intro-conclu-style { font-weight: bold; font-size: 1.1em; margin-bottom: 8px; }
                .text-style { margin-bottom: 8px; }
            </style>
        `;
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body>${contentHtml}</body></html>`;

        try {
            const converted = htmlDocx.asBlob(fullHtml);
            const link = document.createElement("a");
            link.href = URL.createObjectURL(converted);
            link.download = "Mon_Expose_BuroMaster.docx";
            link.click();
        } catch (e) {
            alert("Erreur Word : vérifiez la bibliothèque html-docx.");
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
                          
