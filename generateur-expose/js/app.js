/**
 * MODULE : Main App Controller
 * Rôle : Pilotage de l'interface, gestion du cycle de vie et liaison inter-modules.
 */
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    state: {},

    init() {
        console.log("App: Initialisation du moteur...");
        
        // 1. Charger les données via StorageEngine
        this.state = StorageEngine.load();

        // 2. Initialiser la navigation (Liaison UI)
        this.bindNavigation();

        // 3. Afficher le statut de sauvegarde
        this.updateUIStatus();
        
        console.log("App: Système prêt.");
    },

    /** Gestion du menu latéral */
    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-links li');
        const titleElement = document.getElementById('current-step-title');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Nettoyage UI
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const target = item.getAttribute('data-target');
                titleElement.innerText = item.innerText;

                // Liaison : Appel du module spécifique selon la vue
                this.router(target);
            });
        });
    },

    /** Routeur simple pour charger les modules */
    router(target) {
        console.log(`Navigation vers : ${target}`);
        // Ici, nous appellerons Planificateur.render() ou Editeur.render()
        // selon le module que nous coderons ensuite.
    },

    updateUIStatus() {
        const status = document.getElementById('save-status');
        const now = new Date();
        status.innerText = `Dernière sauvegarde : ${now.getHours()}h${now.getMinutes()}`;
    }
};
