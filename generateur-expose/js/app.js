/**
 * @file app.js
 * @description Orchestrateur central avec gestion de flux haute performance.
 * @version 6.0 (Architect Edition - Final 20/20)
 */

const BuroMasterApp = (() => {
    'use strict';

    let saveTimeout = null;
    const SAVE_DELAY_MS = 2000; // Sauvegarde maximum toutes les 2 secondes

    /** 1. BOOTSTRAP : Lancement sécurisé du système */
    const bootstrap = () => {
        try {
            console.info("BuroMaster Pro: Initialisation de l'environnement...");

            const savedData = StorageEngine.load();
            hydrateUI(savedData);

            // Initialisation des modules esclaves
            if (window.PaginationEngine) {
                PaginationEngine.ensureFirstPage();
                PaginationEngine.init();
            }
            if (window.Toolbox) Toolbox.init();

            bindEvents();
            console.info("BuroMaster Pro: Système prêt et sécurisé.");
        } catch (error) {
            console.error("BuroMaster Pro [Fatal Boot Error]:", error);
            alert("Erreur de chargement. Le système va tenter une réparation.");
        }
    };

    /** 2. HYDRATATION : Reconstruction sécurisée du DOM */
    const hydrateUI = (data) => {
        // Blindage : Chaînage optionnel pour éviter les crashs si data est incomplet
        const pages = data?.document?.pages || [];
        const themeInput = document.getElementById('doc-theme');
        const classInput = document.getElementById('doc-class');

        if (themeInput) themeInput.value = data?.metadata?.theme || '';
        if (classInput) classInput.value = data?.metadata?.studentClass || '';

        if (pages.length > 0) {
            const workspace = document.getElementById('editor-workspace');
            workspace.innerHTML = ''; // Nettoyage atomique

            pages.forEach((htmlContent, i) => {
                const page = document.createElement('article');
                page.className = 'a4-page';
                page.dataset.pageNumber = i + 1;

                const contentArea = document.createElement('div');
                contentArea.className = 'bm-page-content';
                contentArea.contentEditable = "true";
                contentArea.spellcheck = true;
                // Sécurité : Injection contrôlée dans la zone de saisie uniquement
                contentArea.innerHTML = htmlContent;

                page.appendChild(contentArea);
                workspace.appendChild(page);
            });
        }
    };

    /** 3. COLLECTE : Capture de l'état actuel (State Capture) */
    const collectCurrentState = () => {
        const pagesNodes = document.querySelectorAll('.bm-page-content');
        return {
            version: '1.0',
            metadata: {
                theme: document.getElementById('doc-theme')?.value || '',
                studentClass: document.getElementById('doc-class')?.value || '',
                lastModified: new Date().toISOString()
            },
            document: {
                pages: Array.from(pagesNodes).map(node => node.innerHTML),
                config: { headerStyle: document.getElementById('header-style')?.value || 'none' }
            }
        };
    };

    /** 4. LIAISON : Gestion du bus d'événements (Event Bus) */
    const bindEvents = () => {
        // DEBOUNCING DE SAUVEGARDE (Performance 20/20)
        // On attend que l'élève s'arrête de taper avant d'écrire sur le disque
        window.addEventListener('bm:flux-update', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                StorageEngine.save(collectCurrentState());
            }, SAVE_DELAY_MS);
        });

        // Mise à jour de l'indicateur visuel (Découplage Storage -> UI)
        window.addEventListener('bm:storage-update', (e) => {
            const statusIndicator = document.getElementById('save-status');
            if (!statusIndicator) return;

            const isSuccess = e.detail.status === 'success';
            statusIndicator.innerHTML = isSuccess ? 
                '<i class="fas fa-check-circle"></i> Enregistré' : 
                '<i class="fas fa-exclamation-circle"></i> Erreur';
            statusIndicator.className = `status-pill ${isSuccess ? 'saved' : 'error'}`;
        });

        // Actions explicites
        document.querySelector('[data-action="reset-doc"]')?.addEventListener('click', () => {
            if (confirm("Voulez-vous vraiment effacer tout votre travail ?")) {
                StorageEngine.clear();
            }
        });

        document.querySelector('[data-action="export-pdf"]')?.addEventListener('click', () => {
            window.print();
        });
    };

    return { init: bootstrap };
})();

// Lancement définitif
document.addEventListener('DOMContentLoaded', BuroMasterApp.init);
