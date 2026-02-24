/**
 * @file styles-manager.js
 * @description Gestion avancée des styles (Header / Footer)
 * @version 1.0 (Ultra Premium SaaS Edition)
 */

const StylesManager = (() => {
    'use strict';

    let currentHeader = 'none';
    let currentFooter = 'none';
    let galleryModal = null;

    /* ==========================================
       INITIALISATION
    ========================================== */
    const init = () => {
        createGalleryModal();
    };

    /* ==========================================
       CRÉATION MODALE SaaS
    ========================================== */
    const createGalleryModal = () => {

        galleryModal = document.createElement('div');
        galleryModal.className = 'bm-style-modal hidden';

        galleryModal.innerHTML = `
            <div class="bm-style-backdrop"></div>
            <div class="bm-style-container">
                <header class="bm-style-header">
                    <h2>Choisir un style professionnel</h2>
                    <button class="bm-close-style">&times;</button>
                </header>
                <div class="bm-style-grid" id="bm-style-grid"></div>
            </div>
        `;

        document.body.appendChild(galleryModal);

        bindModalEvents();
        generateGallery();
    };

    /* ==========================================
       GÉNÉRATION MINIATURES
    ========================================== */
    const generateGallery = () => {

        const grid = document.getElementById('bm-style-grid');
        if (!grid) return;

        const templates = window.StyleTemplates.getAll();

        templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'bm-style-card';
            card.dataset.header = template.header;
            card.dataset.footer = template.footer;

            card.innerHTML = `
                <div class="bm-style-preview">
                    ${template.preview}
                </div>
                <span>${template.name}</span>
            `;

            card.addEventListener('click', () => {
                applyStyle(template.header, template.footer, true);
            });

            grid.appendChild(card);
        });
    };

    /* ==========================================
       APPLICATION STYLE (LIVE PREVIEW)
    ========================================== */
    const applyStyle = (header, footer, emitEvent = false) => {

        currentHeader = header;
        currentFooter = footer;

        document.querySelectorAll('.a4-page').forEach(page => {

            removeExistingStyle(page);

            if (header !== 'none') {
                const headerEl = document.createElement('div');
                headerEl.className = `bm-header ${header}`;
                page.prepend(headerEl);
            }

            if (footer !== 'none') {
                const footerEl = document.createElement('div');
                footerEl.className = `bm-footer ${footer}`;
                page.appendChild(footerEl);
            }
        });

        if (emitEvent) {
            window.dispatchEvent(new CustomEvent('bm:style-changed'));
        }
    };

    /* ==========================================
       NETTOYAGE
    ========================================== */
    const removeExistingStyle = (page) => {
        page.querySelectorAll('.bm-header, .bm-footer')
            .forEach(el => el.remove());
    };

    /* ==========================================
       OUVERTURE / FERMETURE
    ========================================== */
    const openGallery = () => {
        galleryModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            galleryModal.classList.add('active');
        });
    };

    const closeGallery = () => {
        galleryModal.classList.remove('active');
        setTimeout(() => galleryModal.classList.add('hidden'), 300);
    };

    const bindModalEvents = () => {
        galleryModal.querySelector('.bm-close-style')
            .addEventListener('click', closeGallery);

        galleryModal.querySelector('.bm-style-backdrop')
            .addEventListener('click', closeGallery);
    };

    /* ==========================================
       RESTAURATION
    ========================================== */
    const applySavedStyles = (config) => {
        if (!config) return;
        applyStyle(config.headerStyle, config.footerStyle, false);
    };

    /* ==========================================
       GETTERS (app.js)
    ========================================== */
    const getCurrentHeaderStyle = () => currentHeader;
    const getCurrentFooterStyle = () => currentFooter;

    return {
        init,
        openGallery,
        applySavedStyles,
        getCurrentHeaderStyle,
        getCurrentFooterStyle
    };

})();
