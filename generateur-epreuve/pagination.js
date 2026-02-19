/**
 * BUROMASTER - Module de Gestion des Pages A4
 * Gère le saut de page avec transfert de contenu
 */

let isProcessingPage = false;

function ajouterNouvellePage() {
    if (isProcessingPage) return;
    isProcessingPage = true;

    const container = document.getElementById('main-container');
    const nbPages = document.querySelectorAll('.a4-page').length;
    
    const nouvellePage = document.createElement('div');
    nouvellePage.className = "a4-page";
    
    const zoneTexte = document.createElement('div');
    zoneTexte.className = "page-content";
    zoneTexte.contentEditable = "true";
    zoneTexte.setAttribute('spellcheck', 'true');

    const footer = document.createElement('div');
    footer.className = "page-footer";
    footer.innerText = "BuroMaster | Page " + (nbPages + 1);
    footer.contentEditable = "false";

    nouvellePage.appendChild(zoneTexte);
    nouvellePage.appendChild(footer);
    container.appendChild(nouvellePage);
    
    return zoneTexte; // On retourne la zone pour y injecter le texte
}

let timerPagination; 

function surveillerDepassement(event) {
    if (event.inputType === "deleteContentBackward" || isProcessingPage) return;

    clearTimeout(timerPagination);

    // 100ms pour une réactivité maximale
    timerPagination = setTimeout(() => {
        const contentArea = event.target.closest('.page-content');
        if (!contentArea) return;

        // Sécurité : On ne déclenche QUE si le contenu dépasse réellement 
        // la zone visible de la feuille A4 (clientHeight)
        if (contentArea.scrollHeight > contentArea.clientHeight) { 
            ajouterNouvellePage();
        }
    }, 100); 
}

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('main-container');
    if (container) {
        container.addEventListener('input', surveillerDepassement);
    }
});
