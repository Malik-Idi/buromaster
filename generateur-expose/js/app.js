/**
 * MODULE : Application Orchestrator
 * Rôle : Pilotage global, Liaison IA et Exportation.
 * Liaison : Connecte le Header, la Sidebar et l'Éditeur A4.
 */
const App = {

    init() {
        console.log("BuroMaster: Initialisation du système...");

        // 1. Charger les données existantes (Liaison Storage)
        this.loadDocument();

        // 2. Configurer les actions de la colonne GAUCHE
        this.bindGlobalActions();

        // 3. Lancer la sauvegarde automatique (toutes les 30 secondes)
        setInterval(() => this.saveDocument(), 30000);

        console.log("BuroMaster: Prêt pour l'édition.");
    },

    /** Lie les boutons de contrôle système */
    bindGlobalActions() {
        // Bouton Enregistrer
        document.getElementById('btn-save-local')?.addEventListener('click', () => {
            this.saveDocument();
            alert("Document enregistré localement !");
        });

        // Bouton Réinitialiser (Sécurité blindée)
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            if(confirm("Attention : Cela effacera tout votre travail. Continuer ?")) {
                localStorage.clear();
                window.location.reload();
            }
        });

        // Bouton Imprimer / PDF
        document.getElementById('btn-print-pdf')?.addEventListener('click', () => {
            window.print();
        });

        // Liaison IA : Génération de Plan
        document.getElementById('btn-ai-plan')?.addEventListener('click', () => {
            this.askAI("Génère un plan détaillé pour un exposé sur : " + document.getElementById('doc-theme').value);
        });
    },

    /** Sauvegarde l'intégralité du contenu A4 et des métadonnées */
    saveDocument() {
        const theme = document.getElementById('doc-theme').value;
        const studentClass = document.getElementById('doc-class').value;
        
        // Récupérer le contenu de toutes les pages A4
        const pagesContent = [];
        document.querySelectorAll('.a4-page').forEach(page => {
            pagesContent.push(page.innerHTML);
        });

        const data = {
            metadata: { theme, studentClass },
            content: pagesContent,
            timestamp: new Date().toISOString()
        };

        // Appel au module Storage
        if (typeof StorageEngine !== 'undefined') {
            StorageEngine.save(data);
            this.updateUIStatus();
        }
    },

    /** Recharge le travail précédent au démarrage */
    loadDocument() {
        if (typeof StorageEngine === 'undefined') return;
        
        const data = StorageEngine.load();
        if (data && data.content) {
            document.getElementById('doc-theme').value = data.metadata.theme || "";
            document.getElementById('doc-class').value = data.metadata.studentClass || "";

            const workspace = document.getElementById('editor-workspace');
            workspace.innerHTML = ""; // Vider l'initial

            data.content.forEach((pageHTML, index) => {
                const page = document.createElement('div');
                page.className = 'a4-page';
                page.id = `page-${index + 1}`;
                page.contentEditable = "true";
                page.innerHTML = pageHTML;
                workspace.appendChild(page);
            });
        }
    },

    /** Simulation de l'appel IA (à lier à ton API plus tard) */
    askAI(prompt) {
        console.log("IA sollicitée avec : " + prompt);
        const activePage = document.querySelector('.a4-page:focus') || document.getElementById('page-1');
        
        activePage.innerHTML += `<p style="color:blue;">[IA : En cours de génération pour "${prompt}"...]</p>`;
        // Ici, tu inséreras ton fetch vers l'API OpenAI ou autre.
    },

    updateUIStatus() {
        const status = document.getElementById('save-status');
        if (status) {
            const now = new Date();
            status.innerHTML = `<i class="fas fa-check-circle"></i> Enregistré à ${now.getHours()}h${now.getMinutes()}`;
        }
    }
};

// Lancement final
document.addEventListener('DOMContentLoaded', () => App.init());
