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

    // --- FONCTION DE SAUVEGARDE (Filet de sécurité) ---
    // Cette fonction transforme vos variables en texte (JSON) et les stocke dans le navigateur
    function saveData() {
        const snapshot = {
            content,
            isLocked,
            reachedStepIndex,
            theme: themeInput.value,
            currentStep
        };
        localStorage.setItem("buroMaster_save_2026", JSON.stringify(snapshot));
    }

    // --- FONCTION DE CHARGEMENT ---
    // Au démarrage, on vérifie si une sauvegarde existe pour tout restaurer
    function loadData() {
        const saved = localStorage.getItem("buroMaster_save_2026");
        if (saved) {
            const data = JSON.parse(saved);
            content = data.content;
            isLocked = data.isLocked;
            reachedStepIndex = data.reachedStepIndex;
            themeInput.value = data.theme || "";
            // On retourne à l'étape où l'utilisateur s'était arrêté
            goToStep(data.currentStep || "plan");
        }
    }

    // ==========================================
// PORTION 2 : NAVIGATION ET UI DYNAMIQUE
// ==========================================

    // --- MISE À JOUR VISUELLE DU HEADER ---
    // Cette fonction colore l'onglet actuel et grise les étapes non atteintes
    function updateHeaderUI() {
        document.querySelectorAll(".step-link").forEach((link, index) => {
            if (stepsOrder[index] === currentStep) {
                link.style.color = "#4CAF50"; // Vert pour l'étape active
                link.style.borderBottom = "2px solid #4CAF50";
            } else {
                link.style.borderBottom = "none";
                // Gris si l'étape est bloquée, noir si elle est accessible
                link.style.color = index <= reachedStepIndex ? "#333" : "#ccc";
            }
        });
    }

    // --- GESTION DU VERROUILLAGE (CORRIGÉE) ---
    function toggleInputs(lock) {
        // Verrouillage des éditeurs
        if (currentStep === "dev") {
            document.querySelectorAll(".sub-editor").forEach(ed => ed.readOnly = lock);
            document.querySelectorAll(".generate-sub-btn").forEach(btn => btn.style.display = lock ? "none" : "block");
        } else {
            if (editor) editor.readOnly = lock;
        }

        // CORRECTION : Le thème est modifiable si l'étape actuelle n'est pas verrouillée
        if (themeInput) {
            themeInput.disabled = isLocked[currentStep]; 
        }
    }

    // --- NAVIGATION ENTRE LES ÉTAPES ---
    function goToStep(step) {
        // On sauvegarde le texte actuel avant de changer d'onglet
        if (currentStep !== "dev" && editor) {
            content[currentStep] = editor.value;
        }

        currentStep = step;
        if (stepTitle) stepTitle.textContent = "Édition : " + step.toUpperCase();
        
        // On ajuste l'affichage des boutons selon l'état de l'étape choisie
        if (isLocked[step]) {
            validateBtn.textContent = "Modifier cette étape";
            validateBtn.style.background = "#ff9800";
            if (nextStepBtn) nextStepBtn.style.display = "block";
            if (generateBtn) generateBtn.style.display = "none";
        } else {
            validateBtn.textContent = "Valider cette étape";
            validateBtn.style.background = "#4CAF50";
            if (nextStepBtn) nextStepBtn.style.display = "none";
            if (generateBtn) generateBtn.style.display = (step === "dev") ? "none" : "block";
        }

        // Basculement entre l'éditeur simple et les blocs de développement
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

        toggleInputs(isLocked[step]);
        updateHeaderUI();
        updatePreview();
        saveData(); // On enregistre l'étape actuelle dans la sauvegarde
    }

    // Écouteur pour les clics sur les liens du header
    document.querySelectorAll(".step-link").forEach((link, index) => {
        link.addEventListener("click", () => {
            if (index <= reachedStepIndex) goToStep(stepsOrder[index]);
        });
    });

    // Bouton "Étape Suivante"
    if (nextStepBtn) {
        nextStepBtn.addEventListener("click", () => {
            const index = stepsOrder.indexOf(currentStep);
            if (index < stepsOrder.length - 1) goToStep(stepsOrder[index + 1]);
        });
    }

    // ==========================================
// PORTION 3 : VALIDATION ET BLOCS DEV
// ==========================================

    // --- GESTION DU BOUTON VALIDER ---
    if (validateBtn) {
        validateBtn.addEventListener("click", () => {
            if (!isLocked[currentStep]) {
                // ACTION : VALIDER
                if (currentStep !== "dev") content[currentStep] = editor.value;
                
                isLocked[currentStep] = true;
                // On débloque l'accès à l'étape suivante dans le menu
                reachedStepIndex = Math.max(reachedStepIndex, stepsOrder.indexOf(currentStep) + 1);
                
                validateBtn.textContent = "Modifier cette étape";
                validateBtn.style.background = "#ff9800";
                nextStepBtn.style.display = "block";
                generateBtn.style.display = "none";
                
                toggleInputs(true);
            } else {
                // ACTION : MODIFIER
                isLocked[currentStep] = false;
                validateBtn.textContent = "Valider cette étape";
                validateBtn.style.background = "#4CAF50";
                nextStepBtn.style.display = "none";
                // On réaffiche "Générer" sauf pour le dev qui a ses propres boutons
                if(currentStep !== "dev") generateBtn.style.display = "block";
                
                toggleInputs(false);
            }
            updateHeaderUI();
            saveData(); // On sauvegarde l'état verrouillé/déverrouillé
        });
    }

    // --- GÉNÉRATION DES BLOCS DE DÉVELOPPEMENT ---
    function setupDevBlocks() {
        if (!devContainer) return;
        devContainer.innerHTML = "";
        
        // On découpe le plan pour trouver les titres (ex: I. L'histoire)
        const lines = (content.plan || "").split("\n");
        lines.forEach(line => {
            const cleanLine = line.trim();
            // Regex : cherche un chiffre romain suivi d'un point au début de la ligne
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
                                style="background:#2196F3; color:white; border:none; padding:8px; cursor:pointer; border-radius:4px; ${isLocked['dev'] ? 'display:none' : ''}">
                            Générer cette partie
                        </button>
                    </div>
                    <textarea class="sub-editor" placeholder="Développez cette partie ici..." style="width:100%; min-height:120px; padding:10px; border-radius:5px; border:1px solid #ccc;" ${isLocked['dev'] ? 'readonly' : ''}>${content.dev[cleanLine] || ""}</textarea>
                `;
                devContainer.appendChild(block);

                const subEd = block.querySelector(".sub-editor");
                const subGenBtn = block.querySelector(".generate-sub-btn");

                // Sauvegarde immédiate quand on écrit dans un bloc
                subEd.addEventListener("input", (e) => {
                    content.dev[cleanLine] = e.target.value;
                    updatePreview();
                    saveData();
                });

                // Événement pour l'IA (la fonction sera définie en Portion 5)
                subGenBtn.addEventListener("click", () => {
                    handleSubGeneration(cleanLine, subEd, subGenBtn);
                });
            }
        });
    }

     // ==========================================
// PORTION 4 : APERÇU ET GESTION DES PAGES
// ==========================================

    // --- MISE À JOUR DE LA PREVIEW ---
    function updatePreview() {
        if (!pagesContainer) return;
        pagesContainer.innerHTML = ""; // On vide tout pour reconstruire proprement
        let pageNum = 1;
        let currentPage = createNewPage(pageNum);

        // 1. Rendu du SOMMAIRE (Plan)
        if (content.plan) {
            renderSection("SOMMAIRE", content.plan, currentPage, () => { 
                pageNum++; 
                currentPage = createNewPage(pageNum);
                return currentPage;
            });
        }

        // 2. Rendu de l'INTRODUCTION
        if (content.intro || currentStep === "intro") {
            // On force souvent un saut de page pour l'intro pour faire "propre"
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("INTRODUCTION", content.intro, currentPage, () => { 
                pageNum++; currentPage = createNewPage(pageNum);
                return currentPage;
            });
        }

        // 3. Rendu du DÉVELOPPEMENT
        if (Object.keys(content.dev).length > 0 || currentStep === "dev") {
            pageNum++; currentPage = createNewPage(pageNum);
            const devTitle = document.createElement("div");
            devTitle.className = "title-style";
            devTitle.style.textAlign = "center";
            devTitle.style.textDecoration = "underline";
            devTitle.textContent = "DÉVELOPPEMENT";
            currentPage.appendChild(devTitle);

            for (let sectionTitle in content.dev) {
                renderSection(sectionTitle, content.dev[sectionTitle], currentPage, () => { 
                    pageNum++; currentPage = createNewPage(pageNum);
                    return currentPage;
                });
            }
        }

        // 4. Rendu de la CONCLUSION
        if (content.conclu || currentStep === "conclu") {
            pageNum++; currentPage = createNewPage(pageNum);
            renderSection("CONCLUSION", content.conclu, currentPage, () => { 
                pageNum++; currentPage = createNewPage(pageNum);
                return currentPage;
            });
        }
    }

    // --- FONCTION DE RENDU D'UN TEXTE SUR LES PAGES ---
    function renderSection(title, text, pageElement, onBreak) {
        if (!text && !title) return;

        if (title) {
            const t = document.createElement("div");
            t.className = "title-style";
            t.style.marginTop = "15px";
            t.style.fontWeight = "bold";
            t.textContent = title.toUpperCase();
            pageElement.appendChild(t);
        }

        if (!text) return;

        const lines = text.split("\n");
        lines.forEach(line => {
            const cleanLine = line.trim();
            const div = document.createElement("div");
            
            // Stylisation intelligente selon le contenu
            if (/^[IVX]+\./.test(cleanLine)) {
                div.className = "title-style"; // Titre principal
            } else if (/^[A-Z]\./.test(cleanLine)) {
                div.className = "subtitle-style"; // Sous-titre
                div.style.paddingLeft = "15px";
            } else {
                div.className = "text-style"; // Texte normal
                div.style.textAlign = "justify";
            }

            div.textContent = cleanLine === "" ? "\u00A0" : cleanLine;
            pageElement.appendChild(div);

            // GESTION DU SAUT DE PAGE : si la page est trop pleine (850px)
            if (pageElement.scrollHeight > 850) { 
                pageElement.removeChild(div); 
                pageElement = onBreak(); // Appelle la création d'une nouvelle page
                pageElement.appendChild(div); 
            }
        });
    }

    // --- CRÉATION PHYSIQUE D'UNE PAGE ---
    function createNewPage(num) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        const currentTheme = themeInput.value.trim() || "MON EXPOSÉ";
        
        page.innerHTML = `
            <div class="page-header" style="font-size:10px; color:#999; border-bottom:1px solid #eee; margin-bottom:10px;">${currentTheme.toUpperCase()}</div>
            <div class="page-content"></div>
            <div class="page-footer" style="position:absolute; bottom:20px; right:40px; font-size:10px; color:#999;">Page ${num}</div>
        `;
        pagesContainer.appendChild(page);
        return page.querySelector(".page-content");
    }

    // --- ÉCOUTEURS D'ENTRÉE POUR SAUVEGARDE ---
    editor.addEventListener("input", () => { 
        content[currentStep] = editor.value; 
        updatePreview(); 
        saveData(); // Sauvegarde à chaque lettre tapée
    });

    themeInput.addEventListener("input", () => {
        updatePreview();
        saveData();
    });

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

            // Préparation du message pour l'IA (Prompt)
            let prompt = "";
            if (currentStep === "plan") {
                prompt = `Agis comme un expert en rédaction scolaire. Génère UNIQUEMENT un plan détaillé pour l'exposé : "${theme}".

                    CONSIGNES STRICTES :
                    1. Ne rédige aucun contenu pour l’Introduction ni la Conclusion (écris uniquement les mots).
                    2. Utilise exclusivement la hiérarchie : Introduction, I, II, III… et A, B, C, D si nécessaire.
                    3. Ne descends jamais en dessous du niveau A, B, C, D (pas de 1, 2, 3).
                    4. Le texte doit être brut, sans phrases inutiles ni décoration.
                    5. Le plan doit être suffisamment détaillé pour un exposé complet.

                    IMPORTANT :
                    Le modèle ci-dessous est un EXEMPLE DE FORMAT, il ne limite ni le nombre de parties ni de sous-parties.

                    EXEMPLE DE FORMAT :
                    Introduction
                    I. [Titre de partie]
                    A. [Sous-partie]
                    B. [Sous-partie]
                    C. [Sous-partie]
                    II. [Titre de partie]
                    A. [Sous-partie]
                    B. [Sous-partie]
                    Conclusion`;
                   
            } else if (currentStep === "intro") {
                prompt = `Agis comme un professeur et rédige une introduction scolaire claire et pédagogique pour un exposé sur le thème : "${theme}".

                CONSIGNES STRICTES :
                1. N'utilise aucune formule orale (pas de "Mesdames et Messieurs").
                2. Adopte un ton neutre, informatif et scolaire.
                3. Le texte doit être compréhensible par un élève.
                4. L'introduction doit capter l'attention avec une accroche, définir le sujet via une problématique claire et annoncer les étapes du plan.
                5. Utilise des phrases claires et structurées, sans style littéraire excessif.
                6. Organise le texte en plusieurs paragraphes logiques.

                AUTRES RÈGLES :
                - Texte continu (pas de listes).
                - Longueur moyenne (ni trop courte, ni trop longue).
                - Vocabulaire précis mais accessible.`;
                
            } else if (currentStep === "conclu") {
                prompt = `Rédige une conclusion synthétique qui résume les points clés et ouvre sur une réflexion pour un exposé sur : "${theme}".`;
            }

            // Interface : on indique que l'IA travaille
            const originalText = editor.value;
            editor.value = "⏳ Génération en cours par l'IA... Veuillez patienter.";
            generateBtn.disabled = true;

            const result = await callAiAPI(prompt);
            
            // Mise à jour du contenu
            editor.value = result;
            content[currentStep] = result;
            generateBtn.disabled = false;
            
            updatePreview();
            saveData();
        });
    }

    // --- 2. GÉNÉRATION SPÉCIFIQUE POUR LES BLOCS DE DÉVELOPPEMENT ---
    async function handleSubGeneration(sectionTitle, textarea, button) {
        const theme = themeInput.value.trim();
        if (!theme) {
            alert("Veuillez entrer un thème avant de générer.");
            return;
        }

        // Feedback visuel sur le bouton concerné
        const originalBtnText = button.textContent;
        button.textContent = "⏳...";
        button.disabled = true;
        textarea.value = "L'IA développe cette partie...";

        const prompt = `Développe de manière détaillée et pédagogique la partie intitulée "${sectionTitle}" pour un exposé sur le thème "${theme}". Rédige au moins deux paragraphes complets.`;
        
        const result = await callAiAPI(prompt);
        
        textarea.value = result;
        content.dev[sectionTitle] = result; // On enregistre dans l'objet dev
        
        button.textContent = originalBtnText;
        button.disabled = false;
        
        updatePreview();
        saveData();
    }

    // --- 3. LA FONCTION COMMUNE D'APPEL À L'API (Lien avec generate.js) ---
    async function callAiAPI(prompt) {
        try {
            // !! MODIFICATION CLÉ : Utilisation de l'URL Vercel absolue !!
            // ASSURE-TOI QUE L'URL CI-DESSOUS EST LA BONNE POUR TON PROJET VERCEl
            const API_URL = "https://buromaster.vercel.app/api/generate"; 

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                // On inclut le statut et l'URL dans l'erreur pour un meilleur débogage
                const errorDetails = await response.json();
                throw new Error(`Le serveur a renvoyé une erreur ${response.status}: ${errorDetails.error}`);
            }
            
            const data = await response.json();
            return data.text || "L'IA n'a pas renvoyé de texte.";
        } catch (err) {
            console.error("Erreur API:", err);
            return "Erreur IA : " + err.message;
        }
    }

     // ==========================================
// PORTION 6 : EXPORT PDF ET CHARGEMENT FINAL
// ==========================================

    // --- 1. FONCTION D'EXPORTATION PDF ---
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const element = document.getElementById("preview-pages");
            if (!element || !element.innerHTML.trim()) {
                alert("L'exposé est vide. Veuillez rédiger du contenu avant d'exporter.");
                return;
            }

            // Préparation visuelle : On retire temporairement les effets de zoom
            // pour que le PDF soit généré à taille réelle (A4)
            const sheets = document.querySelectorAll(".preview-sheet");
            sheets.forEach(sheet => {
                sheet.dataset.oldTransform = sheet.style.transform;
                sheet.style.transform = "none";
                sheet.style.margin = "0";
            });

            const options = {
                margin: 0,
                filename: `Expose_${themeInput.value || "Mon_Projet"}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: ["css", "after"], after: ".preview-sheet" }
            };

            // Utilisation de la librairie html2pdf
            // Assurez-vous qu'elle est chargée dans votre HTML
            html2pdf().set(options).from(element).save().then(() => {
                // Restauration de l'affichage à l'écran après l'export
                sheets.forEach(sheet => {
                    sheet.style.transform = sheet.dataset.oldTransform || "scale(1)";
                    sheet.style.margin = "20px auto";
                });
            }).catch(err => {
                console.error("Erreur PDF:", err);
                alert("Une erreur est survenue lors de la création du PDF.");
            });
        });
    }

    // --- 2. INITIALISATION AU DÉMARRAGE DU NAVIGATEUR ---
    // Cette étape est CRUCIALE : c'est elle qui réveille tout le script
    
    // On tente de charger une sauvegarde existante
    loadData();

    // Si aucune sauvegarde n'existe, on initialise l'affichage par défaut
    if (reachedStepIndex === 0 && !themeInput.value) {
        goToStep("plan"); 
    } else {
        // Sinon, on rafraîchit simplement l'interface avec les données chargées
        updateHeaderUI();
        updatePreview();
    }

    console.log("Système BuroMaster 2026 prêt et chargé.");
}); // Fermeture finale du document.addEventListener("DOMContentLoaded", ...)
