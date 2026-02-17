/**
 * BUROMASTER - Module de Gestion des Pages A4 (Auto & Manuel)
 */

// 1. Fonction pour créer une nouvelle page
function ajouterNouvellePage() {
    const container = document.querySelector('.paper-container');
    const nbPages = document.querySelectorAll('.a4-page').length;
    
    const nouvellePage = document.createElement('div');
    nouvellePage.className = "a4-page";
    nouvellePage.contentEditable = "true";
    nouvellePage.setAttribute('spellcheck', 'false');
    
    // Numérotation
    const numero = document.createElement('div');
    numero.className = "page-number";
    numero.innerText = "Page " + (nbPages + 1);
    numero.contentEditable = "false";
    
    nouvellePage.appendChild(numero);
    container.appendChild(nouvellePage);
    
    // On met le curseur sur la nouvelle page pour ne pas couper l'élan
    nouvellePage.focus();
}

// 2. LOGIQUE AUTOMATIQUE : Détecter quand on dépasse 297mm
function surveillerDepassement(event) {
    const pageActuelle = event.target;
    
    // On vérifie si c'est bien une page et non un autre élément
    if (!pageActuelle.classList.contains('a4-page')) return;

    // La hauteur max d'une page A4 en pixels (environ 1122px pour 297mm à 96dpi)
    // Mais on utilise clientHeight pour être précis selon ton CSS
    const hauteurMax = pageActuelle.clientHeight;
    const hauteurContenu = pageActuelle.scrollHeight;

    // Si le contenu dépasse la hauteur de la feuille
    if (hauteurContenu > hauteurMax) {
        // On crée la nouvelle page
        ajouterNouvellePage();
        
        // Optionnel : On peut essayer de déplacer le dernier paragraphe vers la nouvelle page
        // pour une transition plus douce, mais commençons par le focus.
    }
}

// 3. ÉCOUTEUR D'ÉVÉNEMENT
// On utilise la "Délégation d'événement" sur le conteneur pour surveiller toutes les pages (actuelles et futures)
document.querySelector('.paper-container').addEventListener('input', surveillerDepassement);
