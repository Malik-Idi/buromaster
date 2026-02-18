/**
 * BUROMASTER - Module de Gestion des Pages A4
 * Saisie directe avec saut de page fluide
 */

let isProcessing = false;

function ajouterNouvellePage() {
    if (isProcessing) return;
    isProcessing = true;

    const container = document.querySelector('.paper-container');
    const nbPages = document.querySelectorAll('.a4-page').length;
    
    // 1. Création de la structure inspirée de l'autre script mais éditable
    const nouvellePage = document.createElement('div');
    nouvellePage.className = "a4-page";
    
    // On crée une zone interne dédiée UNIQUEMENT au texte
    const zoneTexte = document.createElement('div');
    zoneTexte.className = "page-content";
    zoneTexte.contentEditable = "true";
    zoneTexte.setAttribute('spellcheck', 'false');
    
    // On injecte un paragraphe vide avec un espace invisible pour forcer l'affichage
    zoneTexte.innerHTML = "<p>&#65279;</p>"; 

    // Pied de page pour le numéro
    const footer = document.createElement('div');
    footer.className = "page-footer";
    footer.innerText = "BuroMaster | Page " + (nbPages + 1);
    footer.contentEditable = "false";

    nouvellePage.appendChild(zoneTexte);
    nouvellePage.appendChild(footer);
    container.appendChild(nouvellePage);
    
    // 2. FORCER LE CURSEUR (Le secret pour que les lettres apparaissent)
    setTimeout(() => {
        const p = zoneTexte.querySelector('p');
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(p, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        zoneTexte.focus();
        isProcessing = false;
    }, 50);
}

function surveillerDepassement(event) {
    if (event.inputType === "deleteContentBackward" || isProcessing) return;

    // On cible la zone de contenu et non la page entière
    const contentArea = event.target.closest('.page-content');
    if (!contentArea) return;

    // Détection stricte (Hauteur A4 utile environ 960px)
    if (contentArea.scrollHeight > 960) { 
        ajouterNouvellePage();
    }
}

// Liaison au container
document.querySelector('.paper-container').addEventListener('input', surveillerDepassement);
