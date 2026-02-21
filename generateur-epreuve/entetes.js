/**
 * BUROMASTER - HeaderManager
 * Production ULTIMATE Edition
 * Sécurisé – Interopérable – Extensible
 */

(() => {
    "use strict";

    const HeaderManager = {

        /* ==============================
           ÉTAT INTERNE SÉCURISÉ
        ============================== */

        _state: {
            initialized: false,
            isApplying: false
        },

        /* ==============================
           BANQUE IMMUTABLE (SOURCE DE VÉRITÉ)
        ============================== */

        BANQUE: Object.freeze({
            benin: Object.freeze({
                devoir_officiel: `<div class="header-epreuve benin-style" contenteditable="false" style="border-bottom: 3px double black; padding-bottom: 10px; margin-bottom:20px;">
                <div style="text-align:center; font-family: 'Times New Roman', serif;">
                    <p style="font-weight: bold; margin: 0; font-size: 1.2em;">RÉPUBLIQUE DU BÉNIN</p>
                    <p style="margin: 2px 0; font-size: 0.8em; font-weight:600;">MINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE</p>
                    <p style="font-style: italic; font-size: 0.7em; margin: 0;">Fraternité - Justice - Travail</p>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 0.9em;">
                    <div style="width: 50%;"><strong>DÉPARTEMENT :</strong> .....................<br><strong>ÉTABLISSEMENT :</strong> .....................<br><strong>ANNÉE :</strong> 2024-2025</div>
                    <div style="text-align: right; width: 50%;"><strong>CLASSE :</strong> ....................<br><strong>SÉRIE :</strong> .....................<br><strong>DURÉE :</strong> .....................</div>
                </div>
            </div>`, // 🔁 TU LAISSES TES TEMPLATES EXACTEMENT ICI (inchangés)
                examen_blanc: `<div class="header-epreuve exam-style" contenteditable="false" style="border: 2px solid black; padding: 15px; margin-bottom:20px;">
                <div style="text-align: center; border-bottom: 1px solid black; padding-bottom: 10px; margin-bottom: 10px;">
                    <h2 style="margin: 0; text-transform: uppercase; font-size: 1.3em;">Examen Blanc Départemental</h2>
                    <p style="margin: 5px 0; font-weight: bold;">SESSION DE MAI 2025</p>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>SÉRIE : ....................</span><span>COEF : .......</span><span>ÉPREUVE : ....................</span></div>
            </div>`,
                interro_simple: `<div class="header-epreuve interro-style" contenteditable="false" style="border-left: 8px solid #333; padding-left: 15px; margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div><p style="margin: 2px 0;"><strong>NOM :</strong> ..........................................</p><p style="margin: 2px 0;"><strong>PRÉNOMS :</strong> .................................</p><p style="margin: 2px 0;"><strong>CLASSE :</strong> ...........</p></div>
                    <div style="text-align: center; border: 1px solid black; padding: 10px; min-width: 80px;"><span style="font-size: 0.7em;">NOTE</span><br><span style="font-size: 1.5em;">/20</span></div>
                </div>
                <h3 style="text-align: center; margin: 10px 0; text-decoration: underline;">INTERROGATION ÉCRITE</h3>
            </div>`,
                moderne_pro: `<div class="header-epreuve" contenteditable="false" style="display: flex; border-bottom: 4px solid #000; padding-bottom: 5px; margin-bottom: 20px;">
                <div style="flex: 1; font-size: 0.8em; font-weight: bold;">DÉPARTEMENT DU LITTORAL<br>COORDINATION PCT</div>
                <div style="flex: 2; text-align: center;"><strong>ÉVALUATION SOMMATIVE</strong><br><small>Période : Octobre 2024</small></div>
                <div style="flex: 1; text-align: right; font-size: 0.8em;">Bénin 🇧🇯</div>
            </div>`,
                classique_cadre: `<div class="header-epreuve" contenteditable="false" style="border: 1px solid #000; padding: 10px; text-align: center;">
                <p style="margin:0; font-weight:bold;">COMPLEXE SCOLAIRE : ....................................</p>
                <div style="display: flex; justify-content: space-around; font-size: 0.85em; margin-top: 10px;"><span>CLASSE : ...........</span><span>DURÉE : ...........</span><span>DATE : ..../..../....</span></div>
            </div>`,
                benin_minimal: `<div class="header-epreuve" contenteditable="false" style="border-bottom: 1px dashed #000; padding: 5px 0;">
                <div style="display: flex; justify-content: space-between;"><span><strong>BÉNIN / Enseignement Secondaire</strong></span><span><strong>2024-2025</strong></span></div>
            </div>`
            }),
            togo: Object.freeze({
                devoir_officiel: `<div class="header-epreuve togo-style" contenteditable="false" style="border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom:20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="text-align: left; width: 40%;"><strong>RÉPUBLIQUE TOGOLAISE</strong><br><small>Travail - Liberté - Patrie</small></div>
                    <div style="text-align: right; width: 50%;"><strong>Inspection de l'Éducation :</strong> .............<br><strong>Lycée de :</strong> ................................</div>
                </div>
                <hr style="margin: 10px 0;"><div style="text-align: center; font-weight: bold;">DEVOIR DE CONTRÔLE N°....</div>
            </div>`,
                examen_blanc: `<div class="header-epreuve" contenteditable="false" style="border: 4px double black; padding: 10px; text-align: center;">
                <h1 style="margin: 0; font-size: 1.4em;">BACCALAURÉAT BLANC TOGOLAIS</h1>
                <p>SESSION DE .................... 2025</p>
                <div style="display: flex; justify-content: space-between; padding: 0 20px;"><span>SÉRIE : .......</span><span>DURÉE : .......</span><span>COEF : .......</span></div>
            </div>`,
                interro_simple: `<div class="header-epreuve" contenteditable="false" style="border-bottom: 1px solid #000;">
                <p>Nom & Prénoms : .............................................................. Classe : ........</p>
                <h4 style="text-align: center; background: #eee; padding: 5px;">INTERROGATION DE : ............................</h4>
            </div>`
            })
        }),

        /* ==============================
           INITIALISATION ROBUSTE
        ============================== */

        init() {

            if (this._state.initialized) return;

            const btnAppliquer = document.getElementById('btn-appliquer-entete');
            const selectPays = document.getElementById('select-pays');
            const selectType = document.getElementById('select-type');

            if (btnAppliquer && selectPays && selectType) {
                btnAppliquer.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.appliquer(selectPays.value, selectType.value);
                });
            }

            this._state.initialized = true;
        },

        /* ==============================
           APPLICATION ULTRA SÉCURISÉE
        ============================== */

        appliquer(pays, type) {

            if (this._state.isApplying) return;
            this._state.isApplying = true;

            try {

                // 🔎 Vérification dépendance editeur.js
                if (typeof window.obtenirPageActive !== "function") {
                    console.error("HeaderManager: editeur.js non chargé.");
                    return;
                }

                const zone = window.obtenirPageActive();
                if (!zone || !(zone instanceof HTMLElement)) return;

                // 🛡️ Sélection sécurisée template
                const banquePays = this.BANQUE[pays] || this.BANQUE.benin;
                const htmlEntete = banquePays[type] || banquePays.devoir_officiel;

                if (!htmlEntete || typeof htmlEntete !== "string") return;

                // 🧹 Suppression atomique headers existants
                zone.querySelectorAll('.header-epreuve')
                    .forEach(header => header.remove());

                // 🏗️ Injection DOM contrôlée
                const fragment = document.createRange().createContextualFragment(htmlEntete);
                zone.prepend(fragment);

                // 🔄 Synchronisation directe PaginationEngine (PROPRE)
                if (typeof window.ajusterLeFlux === "function") {
                    window.ajusterLeFlux();
                }

                // 📡 Événement officiel inter-modules
                this._dispatchEvent('buromaster:header-applied', {
                    pays,
                    type
                });

            } catch (error) {
                console.error("HeaderManager Error:", error);
            } finally {
                this._state.isApplying = false;
            }
        },

        /* ==============================
           EVENT BUS PROPRE
        ============================== */

        _dispatchEvent(name, detail = {}) {
            document.dispatchEvent(
                new CustomEvent(name, { detail })
            );
        }
    };

    /* ==============================
       EXPORT SÉCURISÉ PRODUCTION
    ============================== */

    Object.defineProperty(window, 'HeaderManager', {
        value: HeaderManager,
        writable: false,
        configurable: false
    });

    document.addEventListener('DOMContentLoaded', () => {
        HeaderManager.init();
    });

})();
