/**
 * MODULE : Pagination Engine
 * Rôle : Gestion dynamique du débordement de texte et création de pages A4.
 * Liaison : Surveille l'élément #editor-workspace.
 */
const Pagination = {
    // Hauteur maximale d'une page A4 en pixels (approx 29.7cm à 96dpi)
    // On retire un peu de marge pour la sécurité du rendu
    MAX_PAGE_HEIGHT: 1080, 

    init() {
        const workspace = document.getElementById('editor-workspace');
        
        // Observer les changements de texte dans le workspace
        const observer = new MutationObserver(() => {
            this.checkOverflow();
        });

        observer.observe(workspace, {
            childList: true,
            characterData: true,
            subtree: true
        });

        console.log("Pagination: Moteur de surveillance actif.");
    },

    /** Vérifie si la dernière page déborde */
    checkOverflow() {
        const pages = document.querySelectorAll('.a4-page');
        const lastPage = pages[pages.length - 1];

        // Si la hauteur du contenu réel dépasse la limite
        if (lastPage.scrollHeight > this.MAX_PAGE_HEIGHT) {
            this.createNewPage(pages.length + 1);
        }
    },

    /** Crée une nouvelle feuille A4 vierge */
    createNewPage(pageNumber) {
        const workspace = document.getElementById('editor-workspace');
        
        const newPage = document.createElement('div');
        newPage.className = 'a4-page';
        newPage.id = `page-${pageNumber}`;
        newPage.contentEditable = "true";
        
        // Ajout à la pile de feuilles
        workspace.appendChild(newPage);
        
        // Focus automatique sur la nouvelle page pour continuer à écrire
        newPage.focus();
        
        console.log(`Pagination: Page ${pageNumber} créée.`);
        
        // Liaison avec le stockage pour mémoriser la structure
        if (typeof StorageEngine !== 'undefined') {
            App.updateUIStatus();
        }
    },

    /** Force un saut de page (utile pour le Planificateur) */
    forcePageBreak() {
        const pages = document.querySelectorAll('.a4-page');
        this.createNewPage(pages.length + 1);
    }
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    Pagination.init();
});
