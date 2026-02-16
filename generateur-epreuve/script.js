/**
 * BUROMASTER STUDIO - Moteur de l'éditeur
 */

// 1. GESTION DE L'INSERTION AU CURSEUR
// Cette fonction permet d'insérer n'importe quel élément là où se trouve le curseur
function insererElement(element) {
    const zone = document.getElementById('epreuve-zone');
    zone.focus(); // On force le focus sur la zone de texte
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents(); // Supprime le texte sélectionné s'il y en a
        range.insertNode(element);

        // On place le curseur juste après l'élément inséré
        range.setStartAfter(element);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

// 2. OUTILS MATHÉMATIQUES
function ajouterEquation() {
    const mfield = document.createElement('math-field');
    
    // Style inline pour que ça s'intègre au texte
    mfield.style.display = "inline-block";
    mfield.style.verticalAlign = "middle";
    
    // Valeur par défaut (facultatif)
    mfield.value = "x = ";
    
    insererElement(mfield);

    // Petit délai pour donner le focus au clavier mathématique
    setTimeout(() => mfield.focus(), 100);
}

// 3. OUTILS DE STRUCTURE
function ajouterExercice() {
    const bloc = document.createElement('div');
    bloc.className = "exercice-container";
    
    // On crée un titre d'exercice propre
    const titre = document.createElement('p');
    titre.innerHTML = "<strong>Exercice : .................... (........ points)</strong>";
    titre.style.marginTop = "20px";
    
    const consigne = document.createElement('p');
    consigne.innerText = "Saisissez votre consigne ici...";
    
    bloc.appendChild(titre);
    bloc.appendChild(consigne);
    
    document.getElementById('epreuve-zone').appendChild(bloc);
}

// 4. OUTILS DIVERS
function ajouterTableau() {
    let lignes = prompt("Nombre de lignes ?", "3");
    let colonnes = prompt("Nombre de colonnes ?", "3");
    
    let table = document.createElement('table');
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.border = "1";

    for (let i = 0; i < lignes; i++) {
        let tr = table.insertRow();
        for (let j = 0; j < colonnes; j++) {
            let td = tr.insertCell();
            td.innerText = "...";
            td.style.padding = "5px";
            td.style.border = "1px solid black";
        }
    }
    insererElement(table);
}

// 5. MISE À JOUR DU TITRE DU DOCUMENT
document.querySelector('.doc-title').addEventListener('input', function() {
    document.title = this.innerText + " | BuroMaster";
});

// 6. INITIALISATION DES BOUTONS DE LA SIDEBAR
// On lie les fonctions aux boutons créés dans le HTML
document.addEventListener('DOMContentLoaded', () => {
    // On sélectionne les boutons par leur titre ou leur icône
    const boutons = document.querySelectorAll('.tool-btn');
    
    boutons.forEach(btn => {
        if (btn.innerText.includes("Équation")) btn.onclick = ajouterEquation;
        if (btn.innerText.includes("Exercice")) btn.onclick = ajouterExercice;
        if (btn.innerText.includes("Tableau")) btn.onclick = ajouterTableau;
    });
});
