/**
 * BUROMASTER STUDIO - Chef d'orchestre final
 */

// 1. LIAISON DES BOUTONS DE LA SIDEBAR GAUCHE (STRUCTURE & SCIENCES)
document.addEventListener('DOMContentLoaded', () => {
    const actions = {
        'btn-maths': ajouterEquation,
        'btn-exercice': ajouterExercice,
        'btn-tableau': ajouterTableau,
        'btn-appliquer-entete': genererEntete,
        'btn-schema': ouvrirBanqueImages,
        'btn-new-page': ajouterNouvellePage,
        'btn-save': sauvegarderLocalement,
        'btn-pdf': () => window.print(),
        'btn-reset': reinitialiserTout
    };

    for (const [id, fonction] of Object.entries(actions)) {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = fonction;
    }

    // Lancement du barème et chargement initial
    const container = document.getElementById('main-container');
    if (container) {
        container.addEventListener('input', () => {
            mettreAJourBareme();
            sauvegarderLocalement();
        });
    }
    
    chargerSauvegardeLocale();
    mettreAJourBareme();
});

// 2. OUTILS D'INSERTION (Utilisent obtenirPageActive() de editeur.js)
function ajouterEquation() {
    const mfield = document.createElement('math-field');
    mfield.value = "x = ";
    insererDansPage(mfield);
    setTimeout(() => mfield.focus(), 100);
}

function ajouterExercice() {
    const div = document.createElement('div');
    div.className = "exercice-container";
    div.innerHTML = "<p><strong>Exercice : .................... (........ points)</strong></p><p>Consigne...</p>";
    insererDansPage(div);
}

function ajouterTableau() {
    const lignes = prompt("Lignes ?", "3");
    const colonnes = prompt("Colonnes ?", "3");
    const table = document.createElement('table');
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    for (let i = 0; i < lignes; i++) {
        let tr = table.insertRow();
        for (let j = 0; j < colonnes; j++) {
            let td = tr.insertCell();
            td.style.border = "1px solid black";
            td.innerText = "...";
        }
    }
    insererDansPage(table);
}

function insererDansPage(element) {
    const zone = obtenirPageActive();
    zone.focus();
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.insertNode(element);
        range.setStartAfter(element);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

// 3. BARÈME GLOBAL (Scruté sur toutes les pages)
function mettreAJourBareme() {
    let texteComplet = "";
    document.querySelectorAll('.page-content').forEach(p => texteComplet += p.innerText + " ");
    
    const regex = /\((\d+[.,]?\d*)\s*(pts?|points?)\)/gi;
    let match, total = 0;
    while ((match = regex.exec(texteComplet)) !== null) {
        let val = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(val)) total += val;
    }
    const aff = document.getElementById('total-score');
    if (aff) {
        aff.innerText = total.toString().replace('.', ',');
        aff.style.color = total > 20 ? "#ef4444" : "#38bdf8";
    }
}

// 4. SAUVEGARDE ET RESET
function sauvegarderLocalement() {
    const container = document.getElementById('main-container');
    const titre = document.querySelector('.doc-title').innerText;
    localStorage.setItem('buromaster_v2_content', container.innerHTML);
    localStorage.setItem('buromaster_v2_title', titre);
}

function chargerSauvegardeLocale() {
    const content = localStorage.getItem('buromaster_v2_content');
    const title = localStorage.getItem('buromaster_v2_title');
    if (content) document.getElementById('main-container').innerHTML = content;
    if (title) document.querySelector('.doc-title').innerText = title;
}

function reinitialiserTout() {
    if (confirm("Action irréversible : effacer toute l'épreuve ?")) {
        localStorage.clear();
        window.location.reload();
    }
}

// 5. BANQUE D'IMAGES (URLs RÉPARÉES)
const BANQUE_IMAGES = {
    "Sciences": [
        { nom: "Bécher", url: "https://upload.wikimedia.org" },
        { nom: "Circuit", url: "https://upload.wikimedia.org" }
    ],
    "Géo": [
        { nom: "Bénin", url: "https://upload.wikimedia.org" }
    ]
};

function ouvrirBanqueImages() {
    const mod = document.createElement('div');
    mod.className = "modale-images";
    let html = `<div class="modale-content"><h3>Banque de schémas</h3><div class="images-grid">`;
    Object.values(BANQUE_IMAGES).flat().forEach(img => {
        html += `<img src="${img.url}" title="${img.nom}" style="width:100px; cursor:pointer;" onclick="insererImage('${img.url}')">`;
    });
    html += `</div><button onclick="this.parentElement.parentElement.remove()">Fermer</button></div>`;
    mod.innerHTML = html;
    document.body.appendChild(mod);
}

function insererImage(url) {
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = "200px";
    insererDansPage(img);
    document.querySelector('.modale-images').remove();
}

function genererEntete() {
    const p = document.getElementById('select-pays').value;
    const t = document.getElementById('select-type').value;
    appliquerEntete(p, t);
}
