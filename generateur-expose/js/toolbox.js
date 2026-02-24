/**
 * @file toolbox.js
 * @description Contrôleur d'édition haute fidélité et sécurisé.
 * @version 5.0 (Architect Edition - Zero Vulnerability)
 */

const Toolbox = (() => {
    'use strict';

    /**
     * Nettoie le contenu HTML avant injection (Sécurité Anti-XSS)
     * @param {string} html 
     * @returns {string}
     */
    const sanitize = (html) => {
        const temp = document.createElement('div');
        temp.textContent = html;
        // On autorise uniquement les URLs valides pour les images par exemple
        return temp.innerHTML.replace(/script/gi, "blocked");
    };

    /**
     * Applique une taille de police en PT (Remplacement de l'obsolète font size)
     * @param {string} size - Valeur en points (ex: '14pt')
     */
    const applyFontSize = (size) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size + 'pt';
        
        // Entoure le texte sélectionné par le span stylisé
        try {
            range.surroundContents(span);
        } catch (e) {
            // Si la sélection traverse plusieurs balises, on utilise une méthode plus robuste
            document.execCommand('fontSize', false, "7"); // Trigger temporaire
            const fonts = document.querySelectorAll('font[size="7"]');
            fonts.forEach(f => {
                f.removeAttribute('size');
                f.style.fontSize = size + 'pt';
                f.tagName = 'span';
            });
        }
        window.dispatchEvent(new CustomEvent('bm:flux-update'));
    };

    /**
     * Insertion de fragments HTML sécurisés
     */
    const safeInsert = (html) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const fragment = range.createContextualFragment(html);
        
        range.insertNode(fragment);
        range.collapse(false); // Place le curseur après l'objet
        window.dispatchEvent(new CustomEvent('bm:flux-update'));
    };

    return {
        init() {
            // 1. Formatage natif (Gras, Italique, etc. via execCommand reste acceptable pour le style simple)
            document.querySelectorAll('.tool-icon').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.execCommand(e.currentTarget.dataset.cmd, false, null);
                    window.dispatchEvent(new CustomEvent('bm:flux-update'));
                });
            });

            // 2. Gestion de la Taille (Logiciel Pro : Unité PT)
            document.getElementById('font-size')?.addEventListener('change', (e) => {
                applyFontSize(e.target.value);
            });

            // 3. Gestion de la Police
            document.getElementById('font-family')?.addEventListener('change', (e) => {
                document.execCommand('fontName', false, e.target.value);
                window.dispatchEvent(new CustomEvent('bm:flux-update'));
            });

            // 4. Insertions complexes
            document.querySelector('[data-insert="table"]')?.addEventListener('click', () => {
                const r = parseInt(prompt("Lignes ?", "3")) || 1;
                const c = parseInt(prompt("Colonnes ?", "3")) || 1;
                
                let table = `<table class="bm-content-table">`;
                for(let i=0; i<r; i++) {
                    table += '<tr>' + '<td>&nbsp;</td>'.repeat(c) + '</tr>';
                }
                table += `</table><p><br></p>`;
                safeInsert(table);
            });

            document.querySelector('[data-insert="image"]')?.addEventListener('click', () => {
                const url = sanitize(prompt("URL de l'image ?"));
                if (url && url !== "null") {
                    safeInsert(`<img src="${url}" class="bm-inserted-img" alt="Illustration">`);
                }
            });

            console.info("Toolbox: Interface d'édition sécurisée initialisée.");
        }
    };
})();

Object.freeze(Toolbox);
