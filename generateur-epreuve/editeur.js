/**
 * BUROMASTER - EditorEngine
 * Production ULTIMATE Edition
 * Sécurisé – Interopérable – Évolutif
 */

(() => {
    "use strict";

    const EditorEngine = {

        /* ==============================
           ÉTAT INTERNE
        ============================== */

        _state: {
            initialized: false,
            isExecuting: false
        },

        /* ==============================
           MOTEUR DE SÉLECTION ROBUSTE
        ============================== */

        obtenirPageActive() {

            const selection = window.getSelection();

            if (selection && selection.rangeCount > 0) {
                let node = selection.anchorNode;

                while (node && node !== document.body) {
                    if (
                        node.nodeType === 1 &&
                        node.classList.contains('page-content')
                    ) {
                        return node;
                    }
                    node = node.parentNode;
                }
            }

            // Fallback sécurisé
            return document.querySelector('.page-content:last-of-type')
                || document.querySelector('.page-content');
        },

        /* ==============================
           EXECUTEUR CENTRAL SÉCURISÉ
        ============================== */

        executer(commande, valeur = null) {

            if (this._state.isExecuting) return;
            this._state.isExecuting = true;

            try {

                const zone = this.obtenirPageActive();
                if (!zone) return;

                zone.focus();

                // Compatibilité actuelle maintenue (fallback)
                if (document.queryCommandSupported?.(commande)) {
                    document.execCommand(commande, false, valeur);
                }

                this._notifyChange();

            } catch (err) {
                console.error("EditorEngine Error:", err);
            } finally {
                this._state.isExecuting = false;
            }
        },

        /* ==============================
           INSERTION HTML SÉCURISÉE
        ============================== */

        _insertHTML(html) {

            const zone = this.obtenirPageActive();
            if (!zone) return;

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);

            const fragment = document
                .createRange()
                .createContextualFragment(html);

            range.deleteContents();
            range.insertNode(fragment);

            this._notifyChange();
        },

        /* ==============================
           COMPOSANTS STRUCTURELS
        ============================== */

        Composants: {

            insererExercice() {

                const totalExo =
                    document.querySelectorAll('.ex-title').length;

                const html = `
                    <div class="exercice-container" style="margin-top: 20px;">
                        <p class="ex-title">
                            <strong>Exercice ${totalExo + 1} (........ points)</strong>
                        </p>
                        <p>Tapez l'énoncé de votre exercice ici...</p>
                    </div><p><br></p>
                `;

                EditorEngine._insertHTML(html);

                EditorEngine._dispatchEvent(
                    'buromaster:component-inserted',
                    { type: 'exercice' }
                );
            },

            insererTableau(rows = 3, cols = 3) {

                rows = parseInt(rows);
                cols = parseInt(cols);

                if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) return;

                let table = document.createElement('table');
                table.style.width = "100%";
                table.style.borderCollapse = "collapse";
                table.style.margin = "15px 0";

                for (let i = 0; i < rows; i++) {
                    let tr = document.createElement('tr');

                    for (let j = 0; j < cols; j++) {
                        let td = document.createElement('td');
                        td.textContent = "...";
                        td.style.border = "1px solid black";
                        td.style.padding = "8px";
                        td.style.minHeight = "25px";
                        tr.appendChild(td);
                    }

                    table.appendChild(tr);
                }

                const range = window.getSelection()?.getRangeAt(0);
                if (!range) return;

                range.insertNode(table);

                this._notifyChange?.();

                EditorEngine._dispatchEvent(
                    'buromaster:component-inserted',
                    { type: 'table' }
                );
            },

            insererEquation(latex = "E = mc^2") {

                if (!latex || typeof latex !== "string") return;

                const wrapper = document.createElement('span');
                wrapper.contentEditable = "false";
                wrapper.style.display = "inline-block";
                wrapper.style.padding = "2px 5px";

                const mathField = document.createElement('math-field');
                mathField.setAttribute('read-only', '');
                mathField.style.border = "none";
                mathField.style.background = "transparent";
                mathField.style.fontSize = "1.2em";
                mathField.textContent = latex;

                wrapper.appendChild(mathField);

                const range = window.getSelection()?.getRangeAt(0);
                if (!range) return;

                range.insertNode(wrapper);

                EditorEngine._notifyChange();

                EditorEngine._dispatchEvent(
                    'buromaster:component-inserted',
                    { type: 'equation' }
                );
            }
        },

        /* ==============================
           SYNCHRONISATION GLOBALE
        ============================== */

        _notifyChange() {

            // Pagination directe (plus de hack input)
            if (typeof window.ajusterLeFlux === "function") {
                window.ajusterLeFlux();
            }

            this._dispatchEvent('buromaster:content-changed');
        },

        _dispatchEvent(name, detail = {}) {
            document.dispatchEvent(
                new CustomEvent(name, { detail })
            );
        },

        /* ==============================
           INITIALISATION UI
        ============================== */

        init() {

            if (this._state.initialized) return;

            const UI_MAPPING = {
                'fmt-bold': 'bold',
                'fmt-italic': 'italic',
                'fmt-underline': 'underline',
                'fmt-strike': 'strikethrough',
                'fmt-left': 'justifyLeft',
                'fmt-center': 'justifyCenter',
                'fmt-right': 'justifyRight',
                'fmt-full': 'justifyFull',
                'fmt-ul': 'insertUnorderedList',
                'fmt-ol': 'insertOrderedList',
                'fmt-indent': 'indent',
                'fmt-outdent': 'outdent'
            };

            Object.entries(UI_MAPPING).forEach(([id, cmd]) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.executer(cmd);
                    });
                }
            });

            this._state.initialized = true;
        }
    };

    /* ==============================
       EXPORT PRODUCTION SAFE
    ============================== */

    Object.defineProperty(window, 'EditorEngine', {
        value: EditorEngine,
        writable: false,
        configurable: false
    });

    Object.defineProperty(window, 'obtenirPageActive', {
        value: () => EditorEngine.obtenirPageActive(),
        writable: false,
        configurable: false
    });

    document.addEventListener('DOMContentLoaded', () => {
        EditorEngine.init();
    });

})();
