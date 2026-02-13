console.log("%c🎨 UI : Tentative de chargement...", "color: cyan; font-weight: bold;");

/**
 * BUROMASTER UI - BLOC 1 (LIAISON & ÉVÉNEMENTS)
 * Version : 2.0 "Béton Armé"
 * Rôle : Capturer les éléments HTML et gérer les interactions de base.
 */

document.addEventListener("DOMContentLoaded", function () {
    // 1. VÉRIFICATION DU MOTEUR (Sécurité critique)
    if (!window.BuroMasterEngine) {
        console.error("❌ Erreur Fatale : Le moteur (script-engine.js) n'est pas chargé.");
        return;
    }

    const Engine = window.BuroMasterEngine;

    // 2. SÉLECTEURS D'ÉLÉMENTS (Helper sécurisé)
    const getEl = (id) => document.getElementById(id);

    const UI = {
        // Zones principales
        editor: getEl("editor"),
        pagesContainer: getEl("preview-pages"),
        devBlocksContainer: getEl("dev-blocks-container"),
        
        // Formulaires
        theme: getEl("theme"),
        studentClass: getEl("studentClass"),
        fontSelect: getEl("fontSelect"),
        fontSizeInput: getEl("fontSizeInput"),
        aiLevel: getEl("aiDetailLevel"),
        autoFormat: getEl("autoFormatCheckbox"),

        // Boutons d'action
        validateBtn: getEl("validateBtn"),
        nextStepBtn: getEl("nextStepBtn"),
        generateBtn: getEl("generateBtn"),
        downloadPdf: getEl("downloadPdf"),
        resetBtn: getEl("resetAllBtn"),

        // Utilitaires
        zoomIn: getEl("zoomInBtn"),
        zoomOut: getEl("zoomOutBtn"),
        zoomLevel: getEl("zoomLevel"),
        undoBtn: getEl("undoBtn"),
        redoBtn: getEl("redoBtn"),
        stepTitle: getEl("step-title")
    };

    // 3. FONCTION DE NOTIFICATION (Visuelle)
    window.showNotification = function(msg, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = msg;
        document.body.appendChild(toast);
        
        // Animation béton
        setTimeout(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";
        }, 10);

        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    };

    // 4. RÉGLAGE DU ZOOM (Indépendant du moteur)
    function updateZoomDisplay() {
        const sheets = document.querySelectorAll(".preview-sheet");
        sheets.forEach(sheet => {
            sheet.style.transform = `scale(${Engine.state.currentZoom})`;
            sheet.style.transformOrigin = "top center";
            // Ajustement dynamique de la hauteur du wrapper pour éviter les chevauchements
            if (sheet.parentElement) {
                sheet.parentElement.style.height = (1123 * Engine.state.currentZoom) + "px";
            }
        });
        if (UI.zoomLevel) UI.zoomLevel.textContent = `${Math.round(Engine.state.currentZoom * 100)}%`;
    }

    // 5. ÉCOUTEURS DE ZOOM
    if (UI.zoomIn) {
        UI.zoomIn.onclick = () => {
            if (Engine.state.currentZoom < 1.5) {
                Engine.state.currentZoom += 0.1;
                updateZoomDisplay();
                Engine.saveState(getUIValues());
            }
        };
    }

    if (UI.zoomOut) {
        UI.zoomOut.onclick = () => {
            if (Engine.state.currentZoom > 0.4) {
                Engine.state.currentZoom -= 0.1;
                updateZoomDisplay();
                Engine.saveState(getUIValues());
            }
        };
    }

    // 6. HELPER POUR RÉCUPÉRER LES VALEURS DE L'UI
    // Utilisé par le moteur pour sauvegarder sans chercher les IDs lui-même
    window.getUIValues = function() {
        return {
            theme: UI.theme?.value || "",
            studentClass: UI.studentClass?.value || "",
            settings: {
                font: UI.fontSelect?.value || "serif",
                fontSize: UI.fontSizeInput?.value || "12",
                aiLevel: UI.aiLevel?.value || "standard"
            }
        };
    };

    // Rendre updateZoomDisplay accessible globalement pour le moteur
    window.refreshZoom = updateZoomDisplay;

    console.log("🏗️ UI Bloc 1 : Liaison terminée.");

/**
 * BUROMASTER UI - BLOC 2 (NAVIGATION & RENDU)
 * Rôle : Gérer le passage entre les étapes et forcer l'affichage sur la page A4.
 */

Object.assign(window, {

    // 1. FONCTION DE NAVIGATION PRINCIPALE
    goToStep: function(step) {
        const Engine = window.BuroMasterEngine;
        const steps = Engine.state.stepsOrder;
        const editor = document.getElementById("editor");

        if (!steps.includes(step)) return;

        // A. Sauvegarde du texte de l'étape quittée (si ce n'est pas le dev)
        if (Engine.state.currentStep !== "dev" && editor) {
            Engine.state.content[Engine.state.currentStep] = editor.value;
        }

        // B. Mise à jour de l'étape actuelle
        Engine.state.currentStep = step;

        // C. Mise à jour visuelle des onglets (Header)
        document.querySelectorAll(".step-link").forEach(link => {
            link.classList.remove("active");
            if (link.dataset.step === step) link.classList.add("active");
        });

        // D. Mise à jour du titre de la zone d'édition
        const stepNames = { plan: "Sommaire", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
        const titleEl = document.getElementById("step-title");
        if (titleEl) titleEl.textContent = `Édition : ${stepNames[step]}`;

        // E. Basculement des interfaces (Editeur vs Blocs Dev)
        const devContainer = document.getElementById("dev-blocks-container");
        if (devContainer) devContainer.style.display = (step === "dev") ? "block" : "none";
        if (editor) editor.style.display = (step === "dev") ? "none" : "block";

        // F. Rafraîchissement complet des données et du rendu A4
        this.refreshUIFromData();
        
        // G. Sauvegarde automatique du nouvel état
        Engine.saveState(window.getUIValues());
    },

    // 2. SYNCHRONISATION GLOBALE (Données -> Écran)
    refreshUIFromData: function() {
        const Engine = window.BuroMasterEngine;
        const editor = document.getElementById("editor");

        // A. Mise à jour du contenu de l'éditeur (si pas en dev)
        if (Engine.state.currentStep !== "dev" && editor) {
            editor.value = Engine.state.content[Engine.state.currentStep] || "";
        }

        // B. Cas spécial : Si on est en Développement, on génère les blocs à gauche
        if (Engine.state.currentStep === "dev") {
            if (typeof this.setupDevBlocks === "function") this.setupDevBlocks();
        }

        // C. DÉCLENCHEMENT DU RENDU A4 (Le cœur du problème)
        this.triggerA4Rendering();
        
        // D. Mise à jour des boutons d'historique
        this.updateHistoryButtons();
    },

    // 3. DÉCLENCHEUR DE RENDU A4 (BÉTONNÉ)
    triggerA4Rendering: function() {
        const Engine = window.BuroMasterEngine;
        const container = document.getElementById("preview-pages");
        if (!container) return;

        const options = {
            font: document.getElementById("fontSelect")?.value || "serif",
            size: (document.getElementById("fontSizeInput")?.value || "12") + "px",
            title: (Engine.state.currentStep !== "dev") ? 
                   Engine.state.currentStep.toUpperCase() : null
        };

        // On appelle le cerveau pour dessiner
        if (Engine.state.currentStep === "dev") {
            const sections = Engine.parsePlan(Engine.state.content.plan);
            Engine.renderDevToA4(container, sections, Engine.state.content.dev, options);
        } else {
            const textToRender = Engine.state.content[Engine.state.currentStep];
            Engine.renderToA4(container, textToRender, options);
        }

        // On réapplique le zoom après le rendu
        if (typeof window.refreshZoom === "function") window.refreshZoom();
    },

    // 4. GESTION DES BOUTONS HISTORIQUE (UI)
    updateHistoryButtons: function() {
        const Engine = window.BuroMasterEngine;
        const btnUndo = document.getElementById("undoBtn");
        const btnRedo = document.getElementById("redoBtn");

        if (btnUndo) {
            btnUndo.disabled = Engine.state.historyStack.length === 0;
            btnUndo.style.opacity = btnUndo.disabled ? "0.3" : "1";
        }
        if (btnRedo) {
            btnRedo.disabled = Engine.state.redoStack.length === 0;
            btnRedo.style.opacity = btnRedo.disabled ? "0.3" : "1";
        }
    }
});

/**
 * BUROMASTER UI - BLOC 3 (RÉDACTION & DÉVELOPPEMENT)
 * Rôle : Capturer la saisie en temps réel et gérer les blocs du corps de l'exposé.
 */

Object.assign(window, {
    // 1. GESTIONNAIRE DE SAISIE AVEC TEMPORISATION (DEBOUNCE)
    // Empêche le moteur de recalculer à chaque milliseconde
    setupLiveEditing: function() {
        const editor = document.getElementById("editor");
        if (!editor) return;

        editor.addEventListener("input", () => {
            const Engine = window.BuroMasterEngine;
            
            // Mise à jour immédiate de la donnée
            Engine.state.content[Engine.state.currentStep] = editor.value;

            // On retarde le rendu A4 pour la performance
            clearTimeout(window.renderTimer);
            window.renderTimer = setTimeout(() => {
                this.triggerA4Rendering();
                Engine.saveState(window.getUIValues());
            }, 800); 
        });
    },

    // 2. GÉNÉRATEUR DE BLOCS DE DÉVELOPPEMENT (BÉTON ARMÉ)
    // Crée les zones de texte à gauche pour l'étape 3
    setupDevBlocks: function() {
        const Engine = window.BuroMasterEngine;
        const container = document.getElementById("dev-blocks-container");
        if (!container) return;

        const sections = Engine.parsePlan(Engine.state.content.plan);
        container.innerHTML = ""; // Nettoyage propre

        // Alerte si le plan a changé
        if (Engine.needsSync(Engine.state.content.plan)) {
            const alertBox = document.createElement("div");
            alertBox.className = "sync-alert-box";
            alertBox.innerHTML = `
                <p>⚠️ Sommaire modifié. Synchroniser les blocs ?</p>
                <button onclick="window.handleSyncClick()">Synchroniser maintenant</button>
            `;
            container.appendChild(alertBox);
        }

        if (sections.length === 0) {
            container.innerHTML = "<p class='empty-msg'>Rédigez d'abord un sommaire avec des titres (ex: I. Titre)</p>";
            return;
        }

        // Création de chaque bloc de rédaction
        sections.forEach(section => {
            const block = document.createElement("div");
            block.className = "dev-block-item";
            
            const isLocked = Engine.state.isLocked["dev"];
            const textValue = Engine.state.content.dev[section.id] || "";

            block.innerHTML = `
                <div class="block-header">
                    <span class="block-label">${section.id}</span>
                    <button class="ai-mini-btn" onclick="window.handleAiSubGen('${section.id}', this)" 
                            style="display: ${isLocked ? 'none' : 'block'}">✨ IA</button>
                </div>
                <textarea class="dev-textarea" 
                          placeholder="Rédigez ici..." 
                          ${isLocked ? 'disabled' : ''}>${textValue}</textarea>
            `;

            container.appendChild(block);

            // Écouteur sur chaque textarea de bloc
            const textarea = block.querySelector(".dev-textarea");
            textarea.addEventListener("input", () => {
                Engine.state.content.dev[section.id] = textarea.value;
                
                // Rendu A4 différé
                clearTimeout(window.renderTimer);
                window.renderTimer = setTimeout(() => {
                    this.triggerA4Rendering();
                    Engine.saveState(window.getUIValues());
                }, 800);
            });
        });
    },

    // 3. ACTIONS DE SYNCHRONISATION (BÉTON)
    handleSyncClick: function() {
        const Engine = window.BuroMasterEngine;
        Engine.saveToHistory();
        Engine.syncDevStructure(Engine.state.content.plan);
        this.refreshUIFromData();
        window.showNotification("Structure mise à jour ! ✅");
    }
});

// Lancement de l'écouteur principal
setTimeout(() => window.setupLiveEditing(), 100);

/**
 * BUROMASTER UI - BLOC 4 (IA, EXPORTS & LANCEMENT)
 * Rôle : Pilotage des fonctions avancées et démarrage sécurisé de l'application.
 */

Object.assign(window, {
    
    // 1. GESTIONNAIRE IA (SUPER BLINDÉ)
    handleAiGeneration: async function() {
        const Engine = window.BuroMasterEngine;
        const btn = document.getElementById("generateBtn");
        const theme = document.getElementById("theme")?.value.trim();

        if (!theme) return window.showNotification("⚠️ Entrez un thème d'abord.", "warn");
        if (Engine.state.isLocked[Engine.state.currentStep]) return;

        // Verrouillage du bouton pour éviter les doubles clics
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Rédaction...";

        // Snapshot de sécurité avant l'IA
        Engine.saveToHistory();

        const prompt = `Rédige la section ${Engine.state.currentStep} pour un exposé sur : ${theme}. 
                       Niveau : ${document.getElementById("studentClass")?.value || 'Scolaire'}. 
                       Style : ${document.getElementById("aiDetailLevel")?.value || 'Standard'}.`;

        try {
            const result = await Engine.callAiAPI(prompt);
            if (result) {
                Engine.state.content[Engine.state.currentStep] = result;
                this.refreshUIFromData();
                window.showNotification("Rédaction IA terminée ! ✨", "success");
            } else {
                window.showNotification("❌ L'IA ne répond pas. Réessayez.", "error");
            }
        } catch (err) {
            window.showNotification("❌ Erreur de connexion API.", "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    // 2. GESTIONNAIRE D'EXPORTATION (PDF & WORD)
    handleExport: function(type) {
        const Engine = window.BuroMasterEngine;
        const container = document.getElementById("preview-pages");
        const themeName = document.getElementById("theme")?.value || "Expose";
        const cleanName = `BuroMaster_${themeName.replace(/\s+/g, '_')}`;

        if (!container || container.children.length === 0) {
            return window.showNotification("⚠️ La page est vide !", "warn");
        }

        if (type === 'pdf') {
            window.showNotification("📄 Préparation du PDF...", "info");
            Engine.generatePDF(container, `${cleanName}.pdf`);
        } else {
            window.showNotification("📝 Préparation du Word...", "info");
            Engine.generateWord(".page-content", `${cleanName}.docx`);
        }
    },

    // 3. BOUTON DE VALIDATION (LOCK SYSTEM)
    handleValidateStep: function() {
        const Engine = window.BuroMasterEngine;
        Engine.saveToHistory();
        
        const isCurrentlyLocked = Engine.state.isLocked[Engine.state.currentStep];
        Engine.state.isLocked[Engine.state.currentStep] = !isCurrentlyLocked;

        if (!isCurrentlyLocked) {
            // Si on vient de verrouiller, on met à jour l'index de progression
            const currentIndex = Engine.state.stepsOrder.indexOf(Engine.state.currentStep);
            Engine.state.reachedStepIndex = Math.max(Engine.state.reachedStepIndex, currentIndex + 1);
        }

        this.goToStep(Engine.state.currentStep);
        window.showNotification(Engine.state.isLocked[Engine.state.currentStep] ? "🔒 Étape validée" : "🔓 Édition activée");
    }
});

/**
 * --- LANCEMENT FINAL DU SITE (LE BÉTON TERMINAL) ---
 */
(function() {
    const Engine = window.BuroMasterEngine;
    
    // 1. Chargement des données
    const lastStep = Engine.loadState();
    
    // 2. Liaison des boutons principaux (ceux qui ne sont pas gérés en inline)
    const bind = (id, fn) => { 
        const el = document.getElementById(id); 
        if (el) el.onclick = fn; 
    };

    bind("validateBtn", () => window.handleValidateStep());
    bind("generateBtn", () => window.handleAiGeneration());
    bind("downloadPdf", () => window.handleExport('pdf'));
    bind("resetAllBtn", () => Engine.factoryReset());
    bind("undoBtn", () => { Engine.undo(); window.refreshUIFromData(); });
    bind("redoBtn", () => { Engine.redo(); window.refreshUIFromData(); });

    // 3. Liaison des onglets de navigation
    document.querySelectorAll(".step-link").forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            window.goToStep(link.dataset.step);
        };
    });

    // 4. Premier affichage
    setTimeout(() => {
        window.goToStep(lastStep);
        console.log("🏗️ Site BuroMaster v2 entièrement déployé.");
    }, 200);
})();

  console.log("%c✅ UI : Entièrement opérationnel.", "color: blue; font-weight: bold;");
if (!window.ENGINE_LOADED) {
    alert("⚠️ ALERTE : Le script UI est chargé, MAIS il ne trouve pas le script ENGINE ! Vérifie l'ordre dans ton HTML.");
}
  
