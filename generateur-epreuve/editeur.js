/**
 * BUROMASTER - Module de mise en forme de texte
 */

// Fonction universelle pour les commandes simples (Gras, Italique, etc.)
function formater(commande, valeur = null) {
    // On s'assure que le focus est sur l'épreuve
    document.getElementById('epreuve-zone').focus();
    document.execCommand(commande, false, valeur);
}

// Fonctions spécifiques pour les outils complexes
function changerCouleur(couleur) {
    formater('foreColor', couleur);
}

function changerFond(couleur) {
    formater('hiliteColor', couleur);
}

function changerTaille(taille) {
    formater('fontSize', taille);
}

// Note pour ton apprentissage : 
// execCommand est "déprécié" dans les standards récents mais 
// reste le seul moyen simple et universel pour faire un éditeur 
// sans charger une bibliothèque de 20 Mo.
