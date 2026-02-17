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

// 5. MISE À JOUR DU TITRE DU DOCUMENT (Plus sécurisé)
const titreDoc = document.querySelector('.doc-title');
if (titreDoc) {
    titreDoc.addEventListener('input', function() {
        document.title = this.innerText + " | BuroMaster";
    });
}

// 6. INITIALISATION (Ajout de la liaison pour les images)
document.addEventListener('DOMContentLoaded', () => {
    const actions = {
        'btn-maths': ajouterEquation,
        'btn-exercice': ajouterExercice,
        'btn-tableau': ajouterTableau,
        'btn-appliquer-entete': genererEntete,
        'btn-schema': ouvrirBanqueImages // Ajouté pour lier le bouton SVT/Chimie
    };

    for (const [id, fonction] of Object.entries(actions)) {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = fonction;
    }
    
    mettreAJourBareme();
});

function mettreAJourBareme() {
    const zoneEpreuve = document.getElementById('epreuve-zone');
    const texte = zoneEpreuve.innerText;
    
    // Cette Regex cherche les nombres entre parenthèses suivis de 'pt' ou 'point'
    const regexPoints = /\((\d+[.,]?\d*)\s*(pts?|points?)\)/gi;
    let match;
    let total = 0;

    while ((match = regexPoints.exec(texte)) !== null) {
        // match[1] contient uniquement le chiffre capturé par la parenthèse (\d+[.,]?\d*)
        let valeur = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(valeur)) {
            total += valeur;
        }
    }

    // Mise à jour de l'affichage dans la sidebar droite
    const afficheur = document.getElementById('total-score');
    if(afficheur) {
        afficheur.innerText = total.toString().replace('.', ',');
        
        // Petit effet visuel : si > 20, on met en rouge
        afficheur.style.color = total > 20 ? "#ef4444" : "#38bdf8";
    }
}

// On lance la mise à jour dès que le prof tape au clavier
document.getElementById('epreuve-zone').addEventListener('input', mettreAJourBareme);

const BANQUE_IMAGES = {
    "Physique-Chimie": [
        { nom: "Circuit simple", url: "https://upload.wikimedia.org" },
        { nom: "Bécher", url: "https://upload.wikimedia.org" },
        { nom: "Éprouvette", url: "https://upload.wikimedia.org" }
    ],
    "Géographie": [
        { nom: "Carte Bénin (Fond)", url: "https://upload.wikimedia.org" },
        { nom: "Afrique de l'Ouest", url: "https://upload.wikimedia.org" }
    ]
};

function ouvrirBanqueImages() {
    // 1. Création de la fenêtre (Modale)
    const modale = document.createElement('div');
    modale.className = "modale-images";
    
    let contenu = `
        <div class="modale-content">
            <div class="modale-header">
                <h3>Banque de schémas</h3>
                <button onclick="this.closest('.modale-images').remove()">×</button>
            </div>
            <div class="modale-body">
    `;

    for (const [categorie, images] of Object.entries(BANQUE_IMAGES)) {
        contenu += `<h4>${categorie}</h4><div class="images-grid">`;
        images.forEach(img => {
            contenu += `<img src="${img.url}" title="${img.nom}" onclick="insererImageBanque('${img.url}')">`;
        });
        contenu += `</div>`;
    }

    contenu += `</div></div>`;
    modale.innerHTML = contenu;
    document.body.appendChild(modale);
}

function insererImageBanque(url) {
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = "150px";
    img.style.cursor = "move";
    img.style.margin = "10px";
    
    insererElement(img);
    document.querySelector('.modale-images').remove(); // Ferme la modale
}

function genererEntete() {
    const pays = document.getElementById('select-pays').value;
    const type = document.getElementById('select-type').value;
    appliquerEntete(pays, type);
}

// --- SYSTÈME HORS-LIGNE (AUTO-SAVE) ---

// 1. Sauvegarder le contenu
function sauvegarderLocalement() {
    const contenu = document.getElementById('epreuve-zone').innerHTML;
    const titre = document.querySelector('.doc-title').innerText;
    
    localStorage.setItem('buromaster_last_content', contenu);
    localStorage.setItem('buromaster_last_title', titre);
    
    console.log("Sauvegardé localement à " + new Date().toLocaleTimeString());
}

// 2. Charger le contenu au démarrage
function chargerSauvegardeLocale() {
    const contenuSauvegarde = localStorage.getItem('buromaster_last_content');
    const titreSauvegarde = localStorage.getItem('buromaster_last_title');

    if (contenuSauvegarde) {
        document.getElementById('epreuve-zone').innerHTML = contenuSauvegarde;
    }
    if (titreSauvegarde) {
        document.querySelector('.doc-title').innerText = titreSauvegarde;
    }
}

// 3. Activer la sauvegarde automatique toutes les 30 secondes ET à chaque modification
document.getElementById('epreuve-zone').addEventListener('input', sauvegarderLocalement);

// Lancer le chargement quand la page s'ouvre
window.addEventListener('load', chargerSauvegardeLocale);
