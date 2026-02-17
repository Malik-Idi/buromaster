/**
 * BUROMASTER - Module de mise en forme de texte et paragraphes
 */

function formater(commande, valeur = null) {
    document.getElementById('epreuve-zone').focus();
    document.execCommand(commande, false, valeur);
}

// --- MISE EN FORME DU TEXTE ---
function changerCouleur(couleur) { formater('foreColor', couleur); }
function changerFond(couleur) { formater('hiliteColor', couleur); }
function changerTaille(taille) { formater('fontSize', taille); }

// NOUVEAU : Nettoyer la mise en forme
function effacerMiseEnForme() {
    formater('removeFormat');
}

// --- MISE EN FORME DES PARAGRAPHES ---

// NOUVEAU : Retraits (Indentation)
function changerRetrait(direction) {
    if(direction === 'augmenter') {
        formater('indent');
    } else {
        formater('outdent');
    }
}

// NOUVEAU : Trame de fond du paragraphe (Le bloc entier)
function changerTrameParagraphe(couleur) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let parent = selection.getRangeAt(0).commonAncestorContainer;
        // On remonte jusqu'à trouver l'élément paragraphe ou div parent
        while (parent && parent.nodeType !== 1) {
            parent = parent.parentNode;
        }
        if (parent && parent.id !== 'epreuve-zone') {
            parent.style.backgroundColor = couleur;
            parent.style.padding = "10px"; // Ajoute un peu d'espace pour l'esthétique
        }
    }
}
