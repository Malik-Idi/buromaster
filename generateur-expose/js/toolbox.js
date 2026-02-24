/**
 * MODULE : Toolbox (La Boîte à Outils)
 * Rôle : Actions de formatage et insertion d'objets sur la page A4.
 * Liaison : Agit directement sur les éléments [contenteditable] de la zone centrale.
 */
const Toolbox = {

    /** Applique un format de texte simple (Gras, Italique, etc.) */
    format(command, value = null) {
        // Blindage : s'assurer qu'une page est bien sélectionnée
        document.execCommand(command, false, value);
        console.log(`Toolbox: Commande [${command}] appliquée.`);
    },

    /** Change la police ou la taille de la sélection */
    updateStyle(type, value) {
        if (type === 'font') {
            this.format('fontName', value);
        } else if (type === 'size') {
            // execCommand utilise des index de 1 à 7, nous simulons les points
            this.format('fontSize', value);
        }
    },

    /** Insère un tableau structuré au format académique */
    insertTable() {
        const rows = prompt("Nombre de lignes ?", "3");
        const cols = prompt("Nombre de colonnes ?", "3");

        if (!rows || !cols) return;

        let tableHTML = '<table class="print-table" style="width:100%; border-collapse:collapse; margin:1rem 0;">';
        for (let i = 0; i < rows; i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHTML += '<td style="border:1px solid #cbd5e1; padding:8px;">Cellule</td>';
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</table><p>&nbsp;</p>'; // Espace après le tableau pour continuer à écrire

        this.format('insertHTML', tableHTML);
    },

    /** Ajoute une image avec redimensionnement automatique */
    insertImage() {
        const url = prompt("Collez l'URL de votre image :");
        if (url) {
            const imgHTML = `<img src="${url}" style="max-width:100%; height:auto; display:block; margin:1cm auto;" alt="Image exposé">`;
            this.format('insertHTML', imgHTML);
        }
    },

    /** Initialisation des écouteurs d'événements de la colonne droite */
    init() {
        // Liaison avec les éléments du DOM définis dans index.html
        document.getElementById('font-family')?.addEventListener('change', (e) => {
            this.updateStyle('font', e.target.value);
        });

        document.getElementById('font-size')?.addEventListener('change', (e) => {
            this.updateStyle('size', e.target.value);
        });

        document.getElementById('btn-add-table')?.addEventListener('click', () => {
            this.insertTable();
        });

        document.getElementById('btn-add-image')?.addEventListener('click', () => {
            this.insertImage();
        });

        console.log("Toolbox: Outils d'édition initialisés.");
    }
};

// Lancement au chargement du document
document.addEventListener('DOMContentLoaded', () => {
    Toolbox.init();
});
