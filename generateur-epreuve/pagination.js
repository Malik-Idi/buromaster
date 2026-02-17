let creationEnCours = false; // Empêche de créer plusieurs pages en même temps

function ajouterNouvellePage() {
    if (creationEnCours) return;
    creationEnCours = true;

    const container = document.querySelector('.paper-container');
    const nbPages = document.querySelectorAll('.a4-page').length;
    
    const nouvellePage = document.createElement('div');
    nouvellePage.className = "a4-page";
    nouvellePage.contentEditable = "true";
    
    const numero = document.createElement('div');
    numero.className = "page-number";
    numero.innerText = "Page " + (nbPages + 1);
    numero.contentEditable = "false";
    
    nouvellePage.appendChild(numero);
    container.appendChild(nouvellePage);
    
    nouvellePage.focus();

    // On attend un peu avant de permettre une autre création
    setTimeout(() => { creationEnCours = false; }, 500);
}

function surveillerDepassement(event) {
    // On ne vérifie que si l'utilisateur tape du texte
    if (event.inputType === "deleteContentBackward") return;

    const pageActuelle = event.target.closest('.a4-page');
    if (!pageActuelle) return;

    // On vérifie si le contenu dépasse réellement la hauteur fixe de 297mm
    // On laisse une petite marge de sécurité de 20px
    if (pageActuelle.scrollHeight > pageActuelle.clientHeight + 20) {
        ajouterNouvellePage();
    }
}

// On écoute uniquement dans le conteneur de papier
document.querySelector('.paper-container').addEventListener('input', surveillerDepassement);
