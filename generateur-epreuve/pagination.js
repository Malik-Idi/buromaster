/**
 * BUROMASTER - Module de Gestion des Pages A4
 */

function ajouterNouvellePage() {
    const container = document.querySelector('.paper-container');
    const nbPages = document.querySelectorAll('.a4-page').length;
    
    const nouvellePage = document.createElement('div');
    nouvellePage.className = "a4-page";
    nouvellePage.contentEditable = "true";
    nouvellePage.setAttribute('spellcheck', 'false');
    
    // Numérotation automatique en bas à droite
    const numero = document.createElement('div');
    numero.className = "page-number";
    numero.innerText = "Page " + (nbPages + 1);
    numero.contentEditable = "false"; // On ne veut pas que le prof efface le numéro par erreur
    
    nouvellePage.appendChild(numero);
    container.appendChild(nouvellePage);
    
    // On place le curseur au début de la nouvelle page
    nouvellePage.focus();
}

// Fonction pour supprimer la dernière page (si elle est vide)
function supprimerDernierePage() {
    const pages = document.querySelectorAll('.a4-page');
    if (pages.length > 1) {
        pages[pages.length - 1].remove();
    }
}
