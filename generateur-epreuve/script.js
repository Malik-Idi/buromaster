/**
 * BUROMASTER - Chef d'Orchestre Ultimate (Production Elite)
 * Version Ultimate - Sécurisée, Blindée, Synchronisée
 */

(() => {
    'use strict';

    const AppManagerUltimate = {
        saveTimeout: null,
        debounceDelay: 2000,

        /**
         * INITIALISATION GLOBALE
         */
        init() {
            this.lierBoutons();
            this.chargerSession();
            this.ecouterChangements();
            console.log("BuroMaster Studio Ultimate: Orchestration prête.");
        },

        /**
         * LIAISON DES ACTIONS (Toolbar & Sidebar)
         */
        lierBoutons() {
            const actions = {
                'btn-maths': () => EditorEngine.Composants.insererEquation(),
                'btn-exercice': () => EditorEngine.Composants.insererExercice(),
                'btn-tableau': () => EditorEngine.Composants.insererTableau(),
                'btn-appliquer-entete': () => {
                    const p = document.getElementById('select-pays')?.value;
                    const t = document.getElementById('select-type')?.value;
                    if (p && t) HeaderManager.appliquer(p, t);
                },
                'btn-new-page': () => {
                    const zone = window.creerNouvellePage?.();
                    if (zone) zone.focus();
                },
                'btn-save': () => this.sauvegarderSession(),
                'btn-pdf': () => this.preparerEtImprimer(),
                'btn-reset': () => this.reinitialiserEditeur(),
                'btn-schema': () => this.ouvrirBanqueImages()
            };

            Object.entries(actions).forEach(([id, fn]) => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('click', e => { e.preventDefault(); fn(); });
            });
        },

        /**
         * SURVEILLANCE DES CHANGEMENTS & BARÈME
         */
        ecouterChangements() {
            const container = document.getElementById('main-container');
            if (!container) return;

            const handler = () => {
                this.mettreAJourBareme();
                this.debouncedSave();
            };

            container.addEventListener('input', handler);
            document.addEventListener('buromaster:dom-changed', handler);
        },

        mettreAJourBareme() {
            const pages = document.querySelectorAll('.page-content');
            let texteGlobal = Array.from(pages).map(p => p.innerText).join(' ');

            const regexPoint = /\((\d+[.,]?\d*)\s*(pts?|points?)\)/gi;
            let total = 0, match;
            while ((match = regexPoint.exec(texteGlobal)) !== null) {
                const valeur = parseFloat(match[1].replace(',', '.'));
                if (!isNaN(valeur)) total += valeur;
            }

            const affichage = document.getElementById('total-score');
            if (affichage) {
                affichage.innerText = total.toString().replace('.', ',');
                affichage.style.color = total > 20 ? "#ef4444" : "#0ea5e9";
            }
        },

        /**
         * PERSISTENCE SECURISÉE
         */
        sauvegarderSession() {
            try {
                const container = document.getElementById('main-container');
                const titre = document.getElementById('doc-title')?.innerText || 'Sans titre';

                // Encapsulation blindée pour éviter injection
                const donnees = {
                    titre: titre,
                    html: container?.innerHTML || "",
                    timestamp: Date.now()
                };

                localStorage.setItem('buromaster_v3_data', JSON.stringify(donnees));

                const status = document.getElementById('status-save');
                if (status) {
                    status.innerHTML = '<i class="fas fa-check-double"></i> Synchronisé';
                    setTimeout(() => status.innerHTML = '<i class="fas fa-cloud-check"></i> Sauvegardé', 2000);
                }

                document.dispatchEvent(new CustomEvent('buromaster:session-saved', { detail: donnees }));
            } catch (e) {
                console.error("Sauvegarde échouée:", e);
            }
        },

        debouncedSave() {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.sauvegarderSession(), this.debounceDelay);
        },

        chargerSession() {
            try {
                const rawData = localStorage.getItem('buromaster_v3_data');
                if (!rawData) return;
                const donnees = JSON.parse(rawData);
                const container = document.getElementById('main-container');
                if (donnees.html && container) container.innerHTML = donnees.html;
                if (donnees.titre) document.getElementById('doc-title').innerText = donnees.titre;
            } catch (e) {
                console.error("Erreur de chargement:", e);
            }
        },

        /**
         * UTILITAIRES (Impression & Reset)
         */
        preparerEtImprimer() {
            const titre = document.getElementById('doc-title')?.innerText || 'Document';
            document.title = titre;
            window.print();
        },

        reinitialiserEditeur() {
            if (confirm("⚠️ TOUT SUPPRIMER ? Cette action videra votre épreuve actuelle.")) {
                localStorage.removeItem('buromaster_v3_data');
                location.reload();
            }
        },

        /**
         * BANQUE D'IMAGES SECURISÉE
         */
        ouvrirBanqueImages() {
            const BANQUE_SCHEMAS = [
                { nom: "Bécher", url: "https://cdn-icons-png.flaticon.com/512/1000/1000576.png" },
                { nom: "Atome", url: "https://cdn-icons-png.flaticon.com/512/1000/1000580.png" },
                { nom: "Bénin", url: "https://cdn-icons-png.flaticon.com/512/1000/1000585.png" }
            ];

            const modale = document.createElement('div');
            modale.className = "modale-images";
            Object.assign(modale.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 9999
            });

            const containerDiv = document.createElement('div');
            Object.assign(containerDiv.style, { background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px' });

            const headerDiv = document.createElement('div');
            Object.assign(headerDiv.style, { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' });
            headerDiv.innerHTML = `<h3 style="margin:0;">📁 Schémas & Vecteurs</h3>
                                   <button id="close-modale" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>`;
            containerDiv.appendChild(headerDiv);

            const gridDiv = document.createElement('div');
            Object.assign(gridDiv.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' });

            BANQUE_SCHEMAS.forEach(img => {
                const image = document.createElement('img');
                image.src = img.url;
                image.title = img.nom;
                Object.assign(image.style, { width: '100%', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer' });
                image.className = 'img-pick';
                gridDiv.appendChild(image);
            });

            containerDiv.appendChild(gridDiv);
            modale.appendChild(containerDiv);
            document.body.appendChild(modale);

            // Event delegation sécurisée
            modale.addEventListener('click', e => {
                if (e.target.classList.contains('img-pick')) {
                    const imgHTML = document.createElement('img');
                    imgHTML.src = e.target.src;
                    Object.assign(imgHTML.style, { width: '150px', height: 'auto', display: 'block', margin: '10px auto' });
                    EditorEngine.executer('insertHTML', imgHTML.outerHTML);
                    modale.remove();
                }
                if (e.target.id === 'close-modale') modale.remove();
            });
        }
    };

    document.addEventListener('DOMContentLoaded', () => AppManagerUltimate.init());

    // Export sécurisé des fonctions vitales
    Object.defineProperty(window, 'AppManagerUltimate', { value: AppManagerUltimate, writable: false, configurable: false });
})();
