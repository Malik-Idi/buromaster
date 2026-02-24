/**
 * @file toolbox.js
 * @description Module d'édition avancé - Ultra Premium SaaS Edition
 * @version 7.0 (Enterprise Hardened)
 */

const Toolbox = (() => {
    'use strict';

    let activeEditor = null;

    /* =========================================================
       1️⃣ INITIALISATION & TRACKING FOCUS
    ========================================================= */
    const init = () => {

        console.info("Toolbox v7.0: Initialisation avancée...");

        trackActiveEditor();
        bindFormattingTools();
        bindSelectors();
        bindInsertions();

        console.info("Toolbox v7.0: Système prêt.");
    };

    const trackActiveEditor = () => {
        document.addEventListener('focusin', (e) => {
            if (e.target.classList.contains('bm-page-content')) {
                activeEditor = e.target;
            }
        });
    };

    const ensureEditorFocus = () => {
        if (!activeEditor) {
            console.warn("Toolbox: Aucun éditeur actif.");
            return false;
        }
        activeEditor.focus();
        return true;
    };

    /* =========================================================
       2️⃣ SANITIZATION HARDENED
    ========================================================= */
    const sanitize = (str) => {
        if (!str) return "";
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML
            .replace(/javascript:/gi, "")
            .replace(/data:/gi, "")
            .replace(/script/gi, "");
    };

    const validateImageURL = (url) => {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    };

    /* =========================================================
       3️⃣ COMMANDE SAFE
    ========================================================= */
    const applyCommand = (cmd, value = null) => {
        if (!ensureEditorFocus()) return;

        try {
            document.execCommand(cmd, false, value);
            emitFlux();
        } catch (e) {
            console.error("Toolbox Command Error:", e);
        }
    };

    const emitFlux = () => {
        window.dispatchEvent(new CustomEvent('bm:flux-update'));
    };

    /* =========================================================
       4️⃣ FONT SIZE ROBUSTE
    ========================================================= */
    const setFontSize = (size) => {
        if (!ensureEditorFocus()) return;

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        const span = document.createElement('span');
        span.style.fontSize = `${size}pt`;

        try {
            range.surroundContents(span);
        } catch {
            document.execCommand('fontSize', false, '7');
            document.querySelectorAll('font[size="7"]').forEach(f => {
                f.removeAttribute('size');
                f.style.fontSize = `${size}pt`;
                f.style.fontFamily = 'inherit';
            });
        }

        emitFlux();
    };

    /* =========================================================
       5️⃣ INSERTIONS ENTERPRISE
    ========================================================= */
    const insertTable = (rows = 3, cols = 3) => {
        if (!ensureEditorFocus()) return;

        rows = Math.min(Math.max(parseInt(rows) || 1, 1), 20);
        cols = Math.min(Math.max(parseInt(cols) || 1, 1), 20);

        let html = `<table class="bm-content-table">`;

        for (let i = 0; i < rows; i++) {
            html += '<tr>' + '<td>&nbsp;</td>'.repeat(cols) + '</tr>';
        }

        html += '</table><p><br></p>';

        applyCommand('insertHTML', html);
    };

    const insertImage = (url) => {
        if (!ensureEditorFocus()) return;

        const cleanUrl = sanitize(url);

        if (!validateImageURL(cleanUrl)) {
            console.warn("Toolbox: URL image invalide.");
            return;
        }

        const imgHTML = `
            <figure class="bm-image-wrapper">
                <img src="${cleanUrl}" class="bm-inserted-img" alt="Illustration exposé">
            </figure>
            <p><br></p>
        `;

        applyCommand('insertHTML', imgHTML);
    };

    /* =========================================================
       6️⃣ BINDING INTERFACES
    ========================================================= */
    const bindFormattingTools = () => {
        document.querySelectorAll('.tool-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cmd = e.currentTarget.dataset.cmd;
                if (!cmd) return;
                applyCommand(cmd);
            });
        });
    };

    const bindSelectors = () => {
        document.getElementById('font-family')
            ?.addEventListener('change', (e) => {
                applyCommand('fontName', e.target.value);
            });

        document.getElementById('font-size')
            ?.addEventListener('change', (e) => {
                setFontSize(e.target.value);
            });
    };

    const bindInsertions = () => {
        document.querySelector('[data-insert="table"]')
            ?.addEventListener('click', () => {
                insertTable(3, 3); // Préparation future modale custom
            });

        document.querySelector('[data-insert="image"]')
            ?.addEventListener('click', () => {
                const url = prompt("URL de l'image :");
                if (url) insertImage(url);
            });
    };

    return {
        init,
        insertTable,
        insertImage
    };

})();

Object.freeze(Toolbox);
