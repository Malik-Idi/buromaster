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

function surveillerDepassement(event) {
    if (event.inputType === "deleteContentBackward" || isProcessingPage) return;

    const contentArea = event.target.closest('.page-content');
    if (!contentArea) return;

    // Seuil de sécurité : 960px (~255mm) pour laisser de la place au footer
    if (contentArea.scrollHeight > 960) {
        const lastChild = contentArea.lastElementChild;
        
        // On crée la nouvelle page
        const nouvelleZone = ajouterNouvellePage();
        
        // --- LE TRANSFERT : On déplace le dernier élément vers la nouvelle page ---
        if (lastChild) {
            nouvelleZone.appendChild(lastChild);
        }

        // On place le curseur à la fin du texte transféré
        setTimeout(() => {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(nouvelleZone);
            range.collapse(false); // false = à la fin
            selection.removeAllRanges();
            selection.addRange(range);
            nouvelleZone.focus();
            isProcessingPage = false;
        }, 50);
    }
}

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('main-container');
    if (container) {
        container.addEventListener('input', surveillerDepassement);
    }
});
