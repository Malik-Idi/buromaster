/**
 * BUROMASTER ENGINE - BLOC 1 (SOCLE DE DONNÉES)
 * Version : 2.0 "Béton"
 * Rôle : Gestion de l'état, persistance LocalStorage et historique immuable.
 */

// On utilise un espace de nom global pour que script-ui.js puisse y accéder sans faille.
window.BuroMasterEngine = {
    // 1. ÉTAT INTERNE (STATE)
    // Toutes les variables sont regroupées ici pour éviter les "undefined".
    state: {
        currentStep: "plan",
        stepsOrder: ["plan", "intro", "dev", "conclu"],
        content: { plan: "", intro: "", dev: {}, conclu: "" },
        isLocked: { plan: false, intro: false, dev: false, conclu: false },
        reachedStepIndex: 0,
        currentZoom: 0.6,
        lastSyncedPlan: "",
        historyStack: [],
        redoStack: []
    },

    // 2. CONFIGURATION FIXE
    config: {
        STORAGE_KEY: "buroMaster_premium_save_v2",
        MAX_HISTORY: 30,
        EXPIRATION_MS: 12 * 60 * 60 * 1000 // 12 heures
    },

    // 3. INITIALISATION ET CHARGEMENT (BLINDÉ)
    // Cette fonction restaure les données ou crée un état propre.
    loadState: function() {
        try {
            const saved = localStorage.getItem(this.config.STORAGE_KEY);
            if (!saved) return this.state.currentStep;

            const data = JSON.parse(saved);
            const isExpired = (Date.now() - (data.lastUpdate || 0)) > this.config.EXPIRATION_MS;

            if (isExpired) {
                localStorage.removeItem(this.config.STORAGE_KEY);
                return "plan";
            }

            // On fusionne les données sauvegardées avec l'état par défaut (Deep Merge simple)
            this.state.content = data.content || this.state.content;
            this.state.isLocked = data.isLocked || this.state.isLocked;
            this.state.reachedStepIndex = data.reachedStepIndex || 0;
            this.state.currentZoom = data.currentZoom || 0.6;
            this.state.currentStep = data.currentStep || "plan";
            this.state.lastSyncedPlan = data.lastSyncedPlan || "";

            console.log("✅ État BuroMaster chargé avec succès.");
            return this.state.currentStep;
        } catch (e) {
            console.error("❌ Erreur critique lors du chargement :", e);
            return "plan";
        }
    },

    // 4. SAUVEGARDE AUTOMATIQUE (BLINDÉE)
    // On passe les valeurs de l'UI (thème, classe) en paramètres pour ne pas dépendre du DOM ici.
    saveState: function(uiValues = {}) {
        try {
            const snapshot = {
                content: this.state.content,
                isLocked: this.state.isLocked,
                reachedStepIndex: this.state.reachedStepIndex,
                currentStep: this.state.currentStep,
                currentZoom: this.state.currentZoom,
                lastSyncedPlan: this.state.lastSyncedPlan,
                theme: uiValues.theme || "",
                studentClass: uiValues.studentClass || "",
                settings: uiValues.settings || {},
                lastUpdate: Date.now()
            };
            localStorage.setItem(this.config.STORAGE_KEY, JSON.stringify(snapshot));
        } catch (e) {
            console.warn("⚠️ Impossible de sauvegarder dans le navigateur :", e);
        }
    },

    // 5. SYSTÈME D'HISTORIQUE (SNAPSHOTS IMMUABLES)
    saveToHistory: function() {
        if (this.state.historyStack.length >= this.config.MAX_HISTORY) {
            this.state.historyStack.shift();
        }
        // On utilise JSON.parse(JSON.stringify) pour casser les références mémoire.
        const snapshot = JSON.parse(JSON.stringify({
            content: this.state.content,
            isLocked: this.state.isLocked
        }));
        this.state.historyStack.push(snapshot);
        this.state.redoStack = []; // Reset du redo sur nouvelle action
    }
};

/**
 * BUROMASTER ENGINE - BLOC 2 (MOTEUR DE RENDU)
 * Rôle : Transformation du texte en pages A4 physiques avec gestion des débordements.
 */

// Extension de l'objet global défini dans le Bloc 1
Object.assign(window.BuroMasterEngine, {

    // 1. GÉNÉRATEUR DE PAGES (STRUCTURE BÉTON)
    // Crée le conteneur physique d'une page A4
    createPageElement: function(container, pageNum) {
        const wrapper = document.createElement("div");
        wrapper.className = "page-wrapper";
        wrapper.setAttribute("data-page", pageNum);
        
        // Structure interne protégée par CSS (preview-sheet)
        wrapper.innerHTML = `
            <div class="preview-sheet">
                <div class="page-content" data-content-page="${pageNum}"></div>
                <div class="page-footer">BuroMaster | Page ${pageNum}</div>
            </div>`;
            
        container.appendChild(wrapper);
        return wrapper.querySelector(".page-content");
    },

    // 2. MOTEUR DE DÉCOUPAGE (WORD-BY-WORD PAGINATION)
    // Paramètres : texte à afficher, conteneur cible, styles (police, taille), et titre éventuel
    renderToA4: function(container, text, options = {}) {
        if (!container) return;
        
        // Sécurité : on vide le conteneur avant de recalculer
        container.innerHTML = "";
        
        const settings = {
            font: options.font || "'Times New Roman', serif",
            size: options.size || "12px",
            title: options.title || null,
            maxHeight: 940 // Hauteur limite en pixels avant saut de page
        };

        let currentPageNum = 1;
        let currentArea = this.createPageElement(container, currentPageNum);

        // A. Ajout du titre de section (si présent)
        if (settings.title) {
            const header = document.createElement("div");
            header.className = "page-header-title";
            header.style.fontFamily = settings.font;
            header.textContent = settings.title;
            currentArea.appendChild(header);
        }

        if (!text) return;

        // B. Traitement par paragraphes puis par mots
        const paragraphs = text.split("\n");
        
        paragraphs.forEach((paraText) => {
            // Création d'un bloc paragraphe pour préserver la structure
            const pDiv = document.createElement("div");
            pDiv.className = "text-paragraph";
            pDiv.style.fontFamily = settings.font;
            pDiv.style.fontSize = settings.size;
            currentArea.appendChild(pDiv);

            const words = paraText.split(" ");
            
            words.forEach((word) => {
                const previousContent = pDiv.textContent;
                pDiv.textContent += (pDiv.textContent ? " " : "") + word;

                // C. Détection critique du débordement
                // On utilise scrollHeight qui est indépendant du zoom CSS
                if (currentArea.scrollHeight > settings.maxHeight) {
                    // On retire le mot qui a fait déborder
                    pDiv.textContent = previousContent;

                    // Création de la nouvelle page
                    currentPageNum++;
                    currentArea = this.createPageElement(container, currentPageNum);

                    // On recrée un paragraphe sur la nouvelle page pour le mot expulsé
                    const nextP = document.createElement("div");
                    nextP.className = "text-paragraph";
                    nextP.style.fontFamily = settings.font;
                    nextP.style.fontSize = settings.size;
                    nextP.textContent = word;
                    currentArea.appendChild(nextP);
                    
                    // On met à jour pDiv pour les prochains mots du paragraphe initial
                    // mais on change sa référence vers le nouveau paragraphe sur la nouvelle page
                    // pour ne pas perdre la logique de boucle
                }
            });
        });

        console.log(`📄 Rendu terminé : ${currentPageNum} page(s) générée(s).`);
    },

    // 3. ANALYSEUR DE STRUCTURE (PARSER)
    // Transforme le plan en liste de sections pour le développement
    parsePlan: function(planText) {
        if (!planText) return [];
        
        const sections = [];
        const lines = planText.split("\n");
        const sectionRegex = /^([IVX]+|[0-9]+)\s*[\.\-\)]\s*(.+)/i;

        lines.forEach(line => {
            const cleanLine = line.trim();
            const match = cleanLine.match(sectionRegex);
            if (match) {
                sections.push({
                    id: cleanLine, // Identifiant unique basé sur le titre complet
                    label: match[0], // ex: "I. Introduction"
                    content: match[2].trim() // ex: "Introduction"
                });
            }
        });
        return sections;
    }
});

/**
 * BUROMASTER ENGINE - BLOC 3 (DÉVELOPPEMENT & SYNC)
 * Rôle : Gestion des blocs de rédaction du corps et maintien de l'intégrité des données.
 */

Object.assign(window.BuroMasterEngine, {

    // 1. MOTEUR DE RENDU SPÉCIFIQUE AU DÉVELOPPEMENT
    // Contrairement au rendu classique, celui-ci assemble plusieurs blocs de texte
    renderDevToA4: function(container, sections, devContent, options = {}) {
        if (!container) return;
        container.innerHTML = "";

        const settings = {
            font: options.font || "'Times New Roman', serif",
            size: options.size || "12px",
            maxHeight: 930
        };

        let currentPageNum = 1;
        let currentArea = this.createPageElement(container, currentPageNum);

        // On boucle sur les sections issues du plan
        sections.forEach((section) => {
            // A. Rendu du Titre de la Section (H2)
            const h2 = document.createElement("h2");
            h2.className = "a4-section-title";
            h2.style.fontFamily = settings.font;
            h2.textContent = section.id; // ex: "I. Titre"
            currentArea.appendChild(h2);

            // B. Récupération du texte associé à ce titre
            const textContent = devContent[section.id] || "";
            if (!textContent) return;

            const paragraphs = textContent.split("\n");
            paragraphs.forEach(paraText => {
                const p = document.createElement("div");
                p.className = "text-paragraph";
                p.style.fontFamily = settings.font;
                p.style.fontSize = settings.size;
                currentArea.appendChild(p);

                const words = paraText.split(" ");
                words.forEach(word => {
                    const oldText = p.textContent;
                    p.textContent += (p.textContent ? " " : "") + word;

                    // Détection du débordement
                    if (currentArea.scrollHeight > settings.maxHeight) {
                        p.textContent = oldText;
                        currentPageNum++;
                        currentArea = this.createPageElement(container, currentPageNum);

                        const newP = document.createElement("div");
                        newP.className = "text-paragraph";
                        newP.style.fontFamily = settings.font;
                        newP.style.fontSize = settings.size;
                        newP.textContent = word;
                        currentArea.appendChild(newP);
                    }
                });
            });
        });
    },

    // 2. SYNCHRONISATION INTELLIGENTE (SMART SYNC)
    // Cette fonction met à jour les titres sans supprimer le contenu existant
    syncDevStructure: function(newPlanText) {
        const newSections = this.parsePlan(newPlanText);
        const newDevContent = {};
        
        // On garde une trace de ce qui a déjà été utilisé pour éviter les doublons
        const usedOldKeys = new Set();

        newSections.forEach((section, index) => {
            const newTitle = section.id;

            // Stratégie de récupération du texte :
            // 1. Par titre exact (le plus sûr)
            if (this.state.content.dev[newTitle] !== undefined) {
                newDevContent[newTitle] = this.state.content.dev[newTitle];
            } 
            // 2. Par position (si le titre a juste été corrigé mais l'ordre est le même)
            else {
                const oldTitles = Object.keys(this.state.content.dev);
                const titleAtPosition = oldTitles[index];
                if (titleAtPosition && !usedOldKeys.has(titleAtPosition)) {
                    newDevContent[newTitle] = this.state.content.dev[titleAtPosition];
                    usedOldKeys.add(titleAtPosition);
                } else {
                    newDevContent[newTitle] = ""; // Nouvelle section vide
                }
            }
        });

        // Mise à jour de l'état
        this.state.content.dev = newDevContent;
        this.state.lastSyncedPlan = newPlanText;
        
        return newDevContent;
    },

    // 3. VÉRIFICATEUR DE COHÉRENCE
    // Détermine si une alerte de synchronisation est nécessaire
    needsSync: function(currentPlan) {
        if (!this.state.lastSyncedPlan && currentPlan) return true;
        return (currentPlan.trim() !== this.state.lastSyncedPlan.trim());
    }
});

/**
 * BUROMASTER ENGINE - BLOC 4 (COMMUNICATION & EXPORT)
 * Rôle : API Vercel, Génération PDF/Word et Finalisation.
 */

Object.assign(window.BuroMasterEngine, {

    // 1. COMMUNICATION IA (OPTIMISÉE POUR VERCEL)
    // Blindé contre les coupures réseau et les lenteurs d'API
    callAiAPI: async function(prompt) {
        // Détection de l'URL de l'API (Vercel utilise souvent /api/...)
        const API_URL = "/api/generate"; 
        
        // Disjoncteur de sécurité : Timeout de 45 secondes
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ prompt: prompt }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erreur serveur: ${response.status}`);
            }

            const data = await response.json();
            return data.text || data.content || null;

        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.error("❌ L'API a mis trop de temps à répondre (Vercel Timeout).");
            } else {
                console.error("❌ Erreur de communication API :", err.message);
            }
            return null;
        }
    },

    // 2. MOTEUR D'EXPORTATION PDF (HAUTE RÉSOLUTION)
    // Utilise html2pdf avec des paramètres de lissage de texte
    generatePDF: function(element, fileName) {
        if (!element || typeof html2pdf === "undefined") {
            console.error("❌ Librairie html2pdf manquante ou conteneur vide.");
            return false;
        }

        const options = {
            margin: 0,
            filename: fileName || 'Expose_BuroMaster.pdf',
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        };

        return html2pdf().set(options).from(element).save();
    },

    // 3. MOTEUR D'EXPORTATION WORD (COMPATIBILITÉ OFFICE)
    generateWord: function(pagesSelectors, fileName) {
        if (typeof htmlDocx === "undefined") return false;

        let fullHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: 'Times New Roman', serif;">
        `;

        // Récupération propre de chaque page pour respecter les sauts
        document.querySelectorAll(pagesSelectors).forEach((page, index) => {
            fullHtml += `
                <div class="word-page">
                    ${page.innerHTML}
                </div>
                ${index < document.querySelectorAll(pagesSelectors).length - 1 ? '<br style="page-break-after: always;">' : ''}
            `;
        });

        fullHtml += `</body></html>`;

        try {
            const converted = htmlDocx.asBlob(fullHtml);
            const url = URL.createObjectURL(converted);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName || "Expose_BuroMaster.docx";
            link.click();
            
            // Nettoyage mémoire immédiat
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            return true;
        } catch (e) {
            console.error("❌ Erreur lors de la conversion Word :", e);
            return false;
        }
    },

    // 4. RÉINITIALISATION TOTALE (BÉTONNÉE)
    factoryReset: function() {
        if (confirm("⚠️ Action irréversible : Supprimer tout le travail et les réglages ?")) {
            localStorage.removeItem(this.config.STORAGE_KEY);
            window.location.reload();
        }
    }
});

// INITIALISATION DU CERVEAU AU CHARGEMENT DU FICHIER
(function() {
    console.log("🚀 BuroMaster Engine v2.0 opérationnel.");
})();
