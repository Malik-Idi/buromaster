/**
 * BUROMASTER STUDIO - Moteur de l'éditeur (Version Unifiée Multi-Pages)
 */

// --- FONCTION CERVEAU : TROUVER LA PAGE ACTIVE ---
// Remplace l'ID fixe 'epreuve-zone' pour que les outils sachent où agir
function obtenirPageActive() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let node = selection.anchorNode;
        // On remonte le DOM pour trouver la page A4 parente
        while (node && (!node.classList || !node.classList.contains('a4-page'))) {
            node = node.parentNode;
        }
        if (node) return node;
    }
    // Si aucun focus, on prend la dernière page créée par défaut
    const pages = document.querySelectorAll('.a4-page');
    return pages[pages.length - 1];
}

// 1. GESTION DE L'INSERTION AU CURSEUR
function insererElement(element) {
    const zoneActive = obtenirPageActive();
    zoneActive.focus(); // Focus sur la page où se trouve le prof
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(element);

        range.setStartAfter(element);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

// 2. OUTILS MATHÉMATIQUES
function ajouterEquation() {
    const mfield = document.createElement('math-field');
    mfield.style.display = "inline-block";
    mfield.style.verticalAlign = "middle";
    mfield.value = "x = ";
    
    insererElement(mfield);
    setTimeout(() => mfield.focus(), 100);
}

// 3. OUTILS DE STRUCTURE
function ajouterExercice() {
    const bloc = document.createElement('div');
    bloc.className = "exercice-container";
    
    const titre = document.createElement('p');
    titre.innerHTML = "<strong>Exercice : .................... (........ points)</strong>";
    titre.style.marginTop = "20px";
    
    const consigne = document.createElement('p');
    consigne.innerText = "Saisissez votre consigne ici...";
    
    bloc.appendChild(titre);
    bloc.appendChild(consigne);
    
    // On ajoute l'exercice à la page active
    obtenirPageActive().appendChild(bloc);
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

// 5. MISE À JOUR DU TITRE
const titreDoc = document.querySelector('.doc-title');
if (titreDoc) {
    titreDoc.addEventListener('input', function() {
        document.title = this.innerText + " | BuroMaster";
    });
}

// 6. INITIALISATION DES BOUTONS
document.addEventListener('DOMContentLoaded', () => {
    const actions = {
        'btn-maths': ajouterEquation,
        'btn-exercice': ajouterExercice,
        'btn-tableau': ajouterTableau,
        'btn-appliquer-entete': genererEntete,
        'btn-schema': ouvrirBanqueImages
    };

    for (const [id, fonction] of Object.entries(actions)) {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = fonction;
    }
    
    // Ecouteur global pour le barème (sur tout le container)
    document.querySelector('.paper-container').addEventListener('input', mettreAJourBareme);
    mettreAJourBareme();
});

// --- BARÈME GLOBAL (TOUTES LES PAGES) ---
function mettreAJourBareme() {
    // On récupère le texte de TOUTES les pages
    let texteComplet = "";
    document.querySelectorAll('.a4-page').forEach(page => {
        texteComplet += page.innerText + " ";
    });
    
    const regexPoints = /\((\d+[.,]?\d*)\s*(pts?|points?)\)/gi;
    let match;
    let total = 0;

    while ((match = regexPoints.exec(texteComplet)) !== null) {
        let valeur = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(valeur)) total += valeur;
    }

    const afficheur = document.getElementById('total-score');
    if(afficheur) {
        afficheur.innerText = total.toString().replace('.', ',');
        afficheur.style.color = total > 20 ? "#ef4444" : "#38bdf8";
    }
}

// --- BANQUE D'IMAGES (URLs CORRIGÉES) ---
const BANQUE_IMAGES = {
    "Physique-Chimie": [
        { nom: "Circuit simple", url: "https://upload.wikimedia.org" },
        { nom: "Bécher", url: "https://upload.wikimedia.org" }
    ],
    "Géographie": [
        { nom: "Carte Bénin", url: "https://upload.wikimedia.org" }
    ]
};

function ouvrirBanqueImages() {
    const modale = document.createElement('div');
    modale.className = "modale-images";
    let contenu = `<div class="modale-content"><div class="modale-header"><h3>Banque de schémas</h3><button onclick="this.closest('.modale-images').remove()">×</button></div><div class="modale-body">`;
    for (const [categorie, images] of Object.entries(BANQUE_IMAGES)) {
        contenu += `<h4>${categorie}</h4><div class="images-grid">`;
        images.forEach(img => { contenu += `<img src="${img.url}" title="${img.nom}" onclick="insererImageBanque('${img.url}')">`; });
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
    img.style.margin = "10px";
    insererElement(img);
    document.querySelector('.modale-images').remove();
}

function genererEntete() {
    const pays = document.getElementById('select-pays').value;
    const type = document.getElementById('select-type').value;
    appliquerEntete(pays, type);
}

// --- SYSTÈME HORS-LIGNE MULTI-PAGES ---
function sauvegarderLocalement() {
    // Sauvegarde tout le contenu du container (toutes les pages)
    const container = document.querySelector('.paper-container');
    const titre = document.querySelector('.doc-title').innerText;
    
    localStorage.setItem('buromaster_full_doc', container.innerHTML);
    localStorage.setItem('buromaster_last_title', titre);
}

function chargerSauvegardeLocale() {
    const docSauvegarde = localStorage.getItem('buromaster_full_doc');
    const titreSauvegarde = localStorage.getItem('buromaster_last_title');

    if (docSauvegarde) {
        document.querySelector('.paper-container').innerHTML = docSauvegarde;
    }
    if (titreSauvegarde) {
        document.querySelector('.doc-title').innerText = titreSauvegarde;
    }
}

// On écoute tout le container pour la sauvegarde
document.querySelector('.paper-container').addEventListener('input', sauvegarderLocalement);
window.addEventListener('load', chargerSauvegardeLocale);
