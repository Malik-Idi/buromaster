document.addEventListener("DOMContentLoaded", () => {
    console.log("🟢 DOMContentLoaded fired");
});
/**
 * @file app.js
 * @description Chef d'orchestre central de BuroMaster Pro.
 * @version 7.0 (Gallery Sync Edition - Ultimate Architecture)
 */

const BuroMasterApp = (() => {
    'use strict';

    let saveTimeout = null;
    const SAVE_THROTTLE_MS = 2000;

    /* =====================================================
       1️⃣ BOOTSTRAP : Initialisation complète du système
    ===================================================== */
    const bootstrap = () => {
        try {
            console.info("BuroMaster Pro: Initialisation avancée...");

            const savedData = StorageEngine.load();
            hydrateUI(savedData);

            if (window.PaginationEngine) {
                PaginationEngine.ensureFirstPage();
                PaginationEngine.init();
            }

            if (window.Toolbox) Toolbox.init();

            if (window.StylesManager) {
                StylesManager.init();
            }

            bindGlobalEvents();

            console.info("BuroMaster Pro: Version 7.0 opérationnelle.");
        } catch (error) {
            console.error("Boot Error:", error);
        }
    };

    /* =====================================================
       2️⃣ HYDRATATION : Reconstruction complète du document
    ===================================================== */
    const hydrateUI = (data) => {
        const workspace = document.getElementById('editor-workspace');
        const themeInput = document.getElementById('doc-theme');
        const classInput = document.getElementById('doc-class');

        if (themeInput) themeInput.value = data?.metadata?.theme || '';
        if (classInput) classInput.value = data?.metadata?.studentClass || '';

        const pages = data?.document?.pages || [];

        if (workspace) workspace.innerHTML = '';

        if (pages.length > 0 && workspace) {
            pages.forEach((htmlContent, i) => {
                const page = createPage(i + 1, htmlContent);
                workspace.appendChild(page);
            });
        }

        // 🔥 Restaurer styles si existants
        if (window.StylesManager && data?.document?.config) {
            StylesManager.applySavedStyles(data.document.config);
        }
    };

    /* =====================================================
       3️⃣ FABRIQUE DE PAGE (Factorisée)
    ===================================================== */
    const createPage = (pageNumber, htmlContent = '') => {
        const page = document.createElement('article');
        page.className = 'a4-page';
        page.dataset.pageNumber = pageNumber;

        const contentArea = document.createElement('div');
        contentArea.className = 'bm-page-content';
        contentArea.contentEditable = "true";
        contentArea.spellcheck = true;
        contentArea.innerHTML = htmlContent;

        page.appendChild(contentArea);
        return page;
    };

    /* =====================================================
       4️⃣ COLLECTE : Capture complète de l'état
    ===================================================== */
    const collectDocumentState = () => {
        const pagesNodes = document.querySelectorAll('.bm-page-content');

        return {
            version: '2.0',
            metadata: {
                theme: document.getElementById('doc-theme')?.value || '',
                studentClass: document.getElementById('doc-class')?.value || '',
                lastModified: new Date().toISOString()
            },
            document: {
                pages: Array.from(pagesNodes).map(node => node.innerHTML),
                config: {
                    headerStyle: StylesManager?.getCurrentHeaderStyle() || 'none',
                    footerStyle: StylesManager?.getCurrentFooterStyle() || 'none'
                }
            }
        };
    };

    /* =====================================================
       5️⃣ GALERIE : Ouverture Modale
    ===================================================== */
    const openGalleryModal = () => {
        if (!window.StylesManager) return;
        StylesManager.openGallery();
    };

    /* =====================================================
       6️⃣ BUS D'ÉVÉNEMENTS GLOBAL
    ===================================================== */
    const bindGlobalEvents = () => {

        /* 🔁 Sauvegarde intelligente */
        window.addEventListener('bm:flux-update', () => {
            throttleSave();
        });

        window.addEventListener('bm:style-changed', () => {
            throttleSave();
        });

        /* 💾 Status Storage */
        window.addEventListener('bm:storage-update', (e) => {
            const statusEl = document.getElementById('save-status');
            if (!statusEl) return;

            const isSuccess = e.detail.status === 'success';

            statusEl.innerHTML = isSuccess
                ? '<i class="fas fa-cloud-check"></i> Enregistré'
                : '<i class="fas fa-exclamation-circle"></i> Erreur';

            statusEl.className = `status-pill ${isSuccess ? 'saved' : 'error'}`;
        });

        /* 🔄 Reset */
        document.querySelector('[data-action="reset-doc"]')
            ?.addEventListener('click', () => {
                if (confirm("Voulez-vous vraiment réinitialiser tout l'exposé ?")) {
                    StorageEngine.clear();
                }
            });

        /* 📄 Export PDF */
        document.querySelector('[data-action="export-pdf"]')
            ?.addEventListener('click', () => {
                window.print();
            });

        /* 🎨 Ouvrir Galerie */
        document.querySelector('[data-action="open-gallery"]')
            ?.addEventListener('click', openGalleryModal);

        /* 🛑 Backup avant fermeture */
        window.addEventListener('beforeunload', () => {
            StorageEngine.save(collectDocumentState());
        });
    };

    /* =====================================================
       7️⃣ Sauvegarde avec Throttle
    ===================================================== */
    const throttleSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            StorageEngine.save(collectDocumentState());
        }, SAVE_THROTTLE_MS);
    };

    return { init: bootstrap };
})();

document.addEventListener('DOMContentLoaded', BuroMasterApp.init);

window.addEventListener("load", () => {
    const styles = getComputedStyle(document.documentElement);

    console.log("---- CSS LOAD CHECK ----");

    console.log("style.css start:", styles.getPropertyValue("--style-css-start"));
    console.log("style.css end:", styles.getPropertyValue("--style-css-end"));

    console.log("layout.css start:", styles.getPropertyValue("--layout-css-start"));
    console.log("layout.css end:", styles.getPropertyValue("--layout-css-end"));

    console.log("paper.css start:", styles.getPropertyValue("--paper-css-start"));
    console.log("paper.css end:", styles.getPropertyValue("--paper-css-end"));

    console.log("print.css start:", styles.getPropertyValue("--print-css-start"));
    console.log("print.css end:", styles.getPropertyValue("--print-css-end"));
});

window.onerror = function (message, source, lineno, colno, error) {
    console.error("🚨 GLOBAL ERROR:", message);
};

window.addEventListener("load", () => {
    console.log("🟢 Window fully loaded");
});
