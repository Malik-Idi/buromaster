/**
 * @file styles-manager.js
 * @description Moteur de composants dynamiques pour en-têtes et pieds de page.
 * @version 2.0 (Architect Edition - Performance Optimized)
 */

const StylesManager = (() => {
    'use strict';

    // Banque de modèles (Structure pure, sans CSS inline)
    const STYLES_BANK = {
        none: { name: "Aucun style", class: "style-none", header: "", footer: "" },
        standard: {
            name: "Standard Académique",
            class: "style-standard",
            header: `<span class="bm-h-left">{{theme}}</span><span class="bm-h-right">{{class}}</span>`,
            footer: `<span class="bm-f-left">BuroMaster Pro</span><span class="bm-f-right">Page {{current}} / {{total}}</span>`
        },
        modern: {
            name: "Moderne Épuré",
            class: "style-modern",
            header: `<span class="bm-h-accent">●</span> {{theme}}`,
            footer: `{{current}} — {{total}}`
        }
    };

    /** Mise à jour sécurisée du contenu sans toucher à la structure */
    const updateZone = (container, html, data) => {
        if (!html) {
            container.innerHTML = "";
            container.style.display = "none";
            return;
        }
        container.style.display = "flex";
        container.innerHTML = html.replace(/{{theme}}/g, data.theme || 'Sans titre')
                                  .replace(/{{class}}/g, data.studentClass || 'Classe')
                                  .replace(/{{current}}/g, data.currentPage)
                                  .replace(/{{total}}/g, data.totalPages);
    };

    return {
        /** Applique ou rafraîchit le style sur l'ensemble du document */
        applyStyle(styleId = 'none') {
            const style = STYLES_BANK[styleId] || STYLES_BANK.none;
            const pages = document.querySelectorAll('.a4-page');
            const theme = document.getElementById('doc-theme')?.value || '';
            const studentClass = document.getElementById('doc-class')?.value || '';

            pages.forEach((page, index) => {
                // Récupération ou création unique des zones (Performance 20/20)
                let hZone = page.querySelector('.bm-page-header');
                let fZone = page.querySelector('.bm-page-footer');

                if (!hZone) {
                    hZone = document.createElement('div');
                    hZone.className = 'bm-page-header';
                    page.prepend(hZone);
                }
                if (!fZone) {
                    fZone = document.createElement('div');
                    fZone.className = 'bm-page-footer';
                    page.appendChild(fZone);
                }

                // Application de la classe de style (Découplage CSS)
                page.className = `a4-page ${style.class}`;

                // Mise à jour du contenu
                const data = { theme, studentClass, currentPage: index + 1, totalPages: pages.length };
                updateZone(hZone, style.header, data);
                updateZone(fZone, style.footer, data);
            });

            // Signal de sauvegarde pour BuroMasterApp
            window.dispatchEvent(new CustomEvent('bm:flux-update'));
        }
    };
})();

Object.freeze(StylesManager);
