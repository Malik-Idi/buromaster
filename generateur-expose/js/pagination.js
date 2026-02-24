/**
 * @file pagination.js
 * @description Moteur de flux textuel avec transfert de nœuds (Node Shifting).
 * @version 4.0 (Architect Edition - Ultimate)
 */

const PaginationEngine = (() => {
    'use strict';

    const MAX_HEIGHT = 1040; // Hauteur utile en pixels (29.7cm - marges)
    let paginationTimeout = null;

    /** Crée une structure de page A4 standardisée */
    const createPage = (index) => {
        const page = document.createElement('article');
        page.className = 'a4-page';
        page.dataset.pageNumber = index;
        
        const content = document.createElement('div');
        content.className = 'bm-page-content';
        content.contentEditable = "true";
        content.spellcheck = true;
        
        page.appendChild(content);
        return page;
    };

    /** Gère le transfert de contenu vers la page suivante */
    const handleOverflow = (currentPage) => {
        const contentArea = currentPage.querySelector('.bm-page-content');
        const workspace = document.getElementById('editor-workspace');
        
        // Si la page actuelle dépasse la limite
        if (contentArea.offsetHeight > MAX_HEIGHT) {
            let nextPage = currentPage.nextElementSibling;
            
            if (!nextPage) {
                const nextIndex = parseInt(currentPage.dataset.pageNumber) + 1;
                nextPage = createPage(nextIndex);
                workspace.appendChild(nextPage);
            }

            const nextContent = nextPage.querySelector('.bm-page-content');
            
            // On déplace le dernier élément enfant vers le début de la page suivante
            if (contentArea.lastElementChild) {
                const nodeToMove = contentArea.lastElementChild;
                nextContent.prepend(nodeToMove);
                
                // Récursion : on vérifie si la page suivante déborde aussi
                handleOverflow(nextPage);
            }
        }
    };

    /** Gère la suppression des pages vides (Back-merging) */
    const handleUnderflow = (currentPage) => {
        const contentArea = currentPage.querySelector('.bm-page-content');
        const prevPage = currentPage.previousElementSibling;

        // Si la page est vide et qu'il y en a une avant, on la supprime
        if (contentArea.childNodes.length === 0 && prevPage) {
            const prevContent = prevPage.querySelector('.bm-page-content');
            currentPage.remove();
            
            // On replace le curseur à la fin de la page précédente
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(prevContent);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            prevContent.focus();
        }
    };

    return {
        init() {
            const workspace = document.getElementById('editor-workspace');
            if (!workspace) return;

            const observer = new MutationObserver(() => {
                clearTimeout(paginationTimeout);
                paginationTimeout = setTimeout(() => {
                    const pages = workspace.querySelectorAll('.a4-page');
                    pages.forEach(page => {
                        handleOverflow(page);
                        handleUnderflow(page);
                    });
                    
                    // Notifier le stockage du changement de structure
                    window.dispatchEvent(new CustomEvent('bm:flux-update'));
                }, 250);
            });

            observer.observe(workspace, { childList: true, subtree: true, characterData: true });
        },

        ensureFirstPage() {
            const workspace = document.getElementById('editor-workspace');
            if (workspace && workspace.children.length === 0) {
                workspace.appendChild(createPage(1));
            }
        }
    };
})();

Object.freeze(PaginationEngine);
