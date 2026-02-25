console.log("✅ pagination.js chargé");
/**
 * @file pagination.js
 * @description Moteur de pagination A4 dynamique – Version Production SaaS
 * @version 6.0 (Market Hardened Edition)
 */

const PaginationEngine = (() => {
    'use strict';

    let observer = null;
    let flowTimeout = null;
    const DEBOUNCE_DELAY = 180;

    /* ===============================
       UTILITAIRES INTERNES
    =============================== */

    const getWorkspace = () =>
        document.getElementById('editor-workspace');

    const getAllPages = () =>
        Array.from(getWorkspace().querySelectorAll('.a4-page'));

    const getContentArea = (page) =>
        page.querySelector('.bm-page-content');

    const computeAvailableHeight = (page) => {
        // Permet compatibilité future avec header/footer
        const content = getContentArea(page);
        return content.clientHeight;
    };

    const isOverflowing = (page) => {
        const content = getContentArea(page);
        return content.scrollHeight > content.clientHeight;
    };

    const isVisuallyEmpty = (content) => {
        return !content.textContent.trim() && content.children.length === 0;
    };

    /* ===============================
       CRÉATION PAGE
    =============================== */

    const createPageNode = (index) => {
        const page = document.createElement('article');
        page.className = 'a4-page';
        page.dataset.pageNumber = index;

        // Header (préparé pour styles-manager)
        const header = document.createElement('div');
        header.className = 'bm-page-header';

        // Content
        const contentArea = document.createElement('div');
        contentArea.className = 'bm-page-content';
        contentArea.contentEditable = "true";
        contentArea.spellcheck = true;

        // Footer (préparé pour styles-manager)
        const footer = document.createElement('div');
        footer.className = 'bm-page-footer';

        page.append(header, contentArea, footer);
        return page;
    };

    /* ===============================
       OVERFLOW INTELLIGENT
    =============================== */

    const handleOverflow = (page) => {
        if (!isOverflowing(page)) return;

        const workspace = getWorkspace();
        const content = getContentArea(page);

        let nextPage = page.nextElementSibling;

        if (!nextPage) {
            nextPage = createPageNode(getAllPages().length + 1);
            workspace.appendChild(nextPage);
        }

        const nextContent = getContentArea(nextPage);

        // Déplace progressivement les blocs jusqu'à stabilité
        while (isOverflowing(page) && content.lastElementChild) {
            nextContent.prepend(content.lastElementChild);
        }
    };

    /* ===============================
       UNDERFLOW INTELLIGENT
    =============================== */

    const handleUnderflow = (page) => {
        const prevPage = page.previousElementSibling;
        if (!prevPage) return;

        const content = getContentArea(page);

        if (isVisuallyEmpty(content)) {
            page.remove();
            renumberPages();

            const prevContent = getContentArea(prevPage);
            placeCursorAtEnd(prevContent);
        }
    };

    /* ===============================
       CURSEUR
    =============================== */

    const placeCursorAtEnd = (node) => {
        try {
            const range = document.createRange();
            const selection = window.getSelection();

            range.selectNodeContents(node);
            range.collapse(false);

            selection.removeAllRanges();
            selection.addRange(range);
            node.focus();
        } catch (e) {
            console.warn("PaginationEngine: Cursor placement failed.", e);
        }
    };

    /* ===============================
       RENUMÉROTATION
    =============================== */

    const renumberPages = () => {
        getAllPages().forEach((page, i) => {
            page.dataset.pageNumber = i + 1;
        });
    };

    /* ===============================
       FLUX GLOBAL
    =============================== */

    const processFlow = () => {
        const pages = getAllPages();

        pages.forEach(page => {
            handleOverflow(page);
        });

        getAllPages().forEach(page => {
            handleUnderflow(page);
        });

        renumberPages();

        window.dispatchEvent(
            new CustomEvent('bm:flux-update')
        );
    };

    /* ===============================
       API PUBLIQUE
    =============================== */

    return {

        init() {
            const workspace = getWorkspace();
            if (!workspace) return;

            observer = new MutationObserver(() => {
                clearTimeout(flowTimeout);
                flowTimeout = setTimeout(processFlow, DEBOUNCE_DELAY);
            });

            observer.observe(workspace, {
                childList: true,
                subtree: true,
                characterData: true
            });

            console.info("PaginationEngine 6.0 initialized.");
        },

        ensureFirstPage() {
            const workspace = getWorkspace();
            if (workspace && workspace.children.length === 0) {
                workspace.appendChild(createPageNode(1));
            }
        },

        recalculate() {
            processFlow();
        },

        destroy() {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            clearTimeout(flowTimeout);
        }

    };

})();

Object.freeze(PaginationEngine);
