/**
 * BUROMASTER - Module de Gestion des Pages A4
 * Gère le saut de page automatique et manuel sans contradictions
 */

let isProcessing = false; // Verrou de sécurité pour éviter les boucles infinies

/**
 * Crée et insère une nouvelle page A4 dans le document
 */
function ajouterNouvellePage() {
    if (isProcessing) return;
    isProcessing = true;

    const container = document.querySelector('.paper-container');
    const nbPages = document.querySelectorAll('.a4-page').length;
    
    const nouvellePage = document.createElement('div');
    nouvellePage.className = "a4-page";
    nouvellePage.contentEditable = "true";
    nouvellePage.setAttribute('spellcheck', 'false');
    
    // Ajout du numéro de page
    const numero = document.createElement('div');
    numero.className = "page-number";
    numero.innerText = "Page " + (nbPages + 1);
    numero.contentEditable = "false";
    
    nouvellePage.appendChild(numero);
    container.appendChild(nouvellePage);
    
    // Donne le focus à la nouvelle page pour continuer la saisie
    nouvellePage.focus();

    // Déverrouille après un court instant pour laisser le DOM se stabiliser
    setTimeout(() => {
        isProcessing = false;
    }, 300);
}

/**
 * Surveille le débordement de contenu en temps réel
 */
function surveillerDepassement(event) {
    // On ignore si on est en train de supprimer du texte ou si un traitement est en cours
    if (event.inputType === "deleteContentBackward" || isProcessing) return;

    // On cible la page où l'utilisateur écrit
    const pageActuelle = event.target.closest('.a4-page');
    if (!pageActuelle) return;

    // CALCUL CRITIQUE :
    // scrollHeight = hauteur réelle du texte (contenu)
    // clientHeight = hauteur fixe de la feuille (297mm - marges)
    // On ajoute 10px de tolérance pour éviter les déclenchements accidentels
    if (pageActuelle.scrollHeight > pageActuelle.clientHeight + 10) {
        ajouterNouvellePage();
    }
}

/**
 * INITIALISATION
 * Utilise la délégation d'événement pour surveiller toutes les pages
 */
const workspace = document.querySelector('.paper-container');
if (workspace) {
    workspace.addEventListener('input', surveillerDepassement);
}

// Fonction utilitaire pour supprimer la dernière page si nécessaire
function supprimerDernierePage() {
    const pages = document.querySelectorAll('.a4-page');
    if (pages.length > 1 && pages[pages.length - 1].innerText.trim() === "") {
        pages[pages.length - 1].remove();
    }
}
