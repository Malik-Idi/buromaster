/**
 * BUROMASTER - Module de mise en forme de texte et paragraphes
 */

function formater(commande, valeur = null) {
    const zone = document.getElementById('epreuve-zone');
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
        if (parent && parent.id !== 'epreuve-zone') {
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
        // Sécurité : on ne colore pas la zone principale 'epreuve-zone'
        if (parent && parent.id !== 'epreuve-zone' && parent.tagName !== 'BODY') {
            parent.style.backgroundColor = couleur;
            parent.style.padding = "10px";
            parent.style.borderRadius = "4px"; // Optionnel : pour un look plus moderne
        }
    }
}
