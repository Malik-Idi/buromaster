/**
 * BUROMASTER - Module de mise en forme de texte et paragraphes
 */

function formater(commande, valeur = null) {
    // MODIFICATION : On utilise obtenirPageActive() pour que le focus 
    // reste sur la page où le prof travaille (Page 1, 2, 3...)
    const zone = obtenirPageActive();
    if (zone) {
        zone.focus();
        document.execCommand(commande, false, valeur);
    }
}

// --- MISE EN FORME DU TEXTE ---
function changerCouleur(couleur) { formater('foreColor', couleur); }
function changerFond(couleur) { formater('hiliteColor', couleur); }
function changerTaille(taille) { formater('fontSize', taille); }

// Nettoyer la mise en forme (Amélioré)
function effacerMiseEnForme() {
    formater('removeFormat');
    
    // On réinitialise aussi l'éventuelle couleur de fond de bloc
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let parent = selection.getRangeAt(0).commonAncestorContainer;
        while (parent && parent.nodeType !== 1) parent = parent.parentNode;
        
        // MODIFICATION : Sécurité basée sur la classe au lieu de l'ID
        if (parent && !parent.classList.contains('paper-container')) {
            parent.style.backgroundColor = "transparent";
            parent.style.padding = "0px";
        }
    }
}

// --- MISE EN FORME DES PARAGRAPHES ---
function changerRetrait(direction) {
    formater(direction === 'augmenter' ? 'indent' : 'outdent');
}

// Trame de fond du paragraphe (Sécurisé)
function changerTrameParagraphe(couleur) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let parent = selection.getRangeAt(0).commonAncestorContainer;
        while (parent && parent.nodeType !== 1) {
            parent = parent.parentNode;
        }
        
        // MODIFICATION : Sécurité renforcée pour ne pas colorer 
        // le fond gris (paper-container) mais uniquement les blocs dans les pages
        if (parent && !parent.classList.contains('paper-container') && parent.tagName !== 'BODY') {
            parent.style.backgroundColor = couleur;
            parent.style.padding = "10px";
            parent.style.borderRadius = "4px"; 
        }
    }
}
