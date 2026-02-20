/**
 * BUROMASTER STUDIO - Chef d'orchestre Final (Version Elite)
 * Centralise les actions, le barème et la persistance.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. INITIALISATION DES BOUTONS (SIDEBAR GAUCHE & HEADER)
    const actions = {
        'btn-maths': () => EditeurComposants.insererEquation(),
        'btn-exercice': () => EditeurComposants.insererExercice(),
        'btn-tableau': () => EditeurComposants.insererTableau(),
        'btn-appliquer-entete': () => {
            const p = document.getElementById('select-pays').value;
            const t = document.getElementById('select-type').value;
            appliquerEntete(p, t);
        },
        'btn-new-page': () => creerNouvellePage().focus(),
        'btn-save': () => sauvegarderSession(),
        'btn-pdf': () => preparerEtImprimer(),
        'btn-reset': () => reinitialiserEditeur(),
        'btn-schema': () => ouvrirBanqueImages()
    };

    // Liaison sécurisée
    Object.entries(actions).forEach(([id, fn]) => {
        const el = document.getElementById(id);
        if (el) el.onclick = (e) => { e.preventDefault(); fn(); };
    });

    // 2. SURVEILLANCE GLOBALE (BARÈME & AUTO-SAVE)
    const container = document.getElementById('main-container');
    if (container) {
        container.addEventListener('input', () => {
            mettreAJourBareme();
            // Auto-sauvegarde légère toutes les 2 secondes pendant la frappe
            debouncedSave();
        });
    }

    // 3. CHARGEMENT INITIAL
    chargerSession();
    mettreAJourBareme();
});

/**
 * CALCULE LE BARÈME (Regex optimisée pour formats : (2pts), (0.5 pt), (1,25 points))
 */
function mettreAJourBareme() {
    const pages = document.querySelectorAll('.page-content');
    let texteGlobal = "";
    pages.forEach(p => texteGlobal += p.innerText);

    const regexPoint = /\((\d+[.,]?\d*)\s*(pts?|points?)\)/gi;
    let match;
    let total = 0;

    while ((match = regexPoint.exec(texteGlobal)) !== null) {
        let valeur = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(valeur)) total += valeur;
    }

    const affichage = document.getElementById('total-score');
    if (affichage) {
        affichage.innerText = total.toString().replace('.', ',');
        // Alerte visuelle si > 20
        affichage.style.color = total > 20 ? "#ef4444" : "#0ea5e9";
    }
}

/**
 * SYSTÈME DE SAUVEGARDE SÉCURISÉ (LocalStorage)
 */
function sauvegarderSession() {
    const container = document.getElementById('main-container');
    const titre = document.getElementById('doc-title').innerText;
    
    const donnees = {
        titre: titre,
        html: container.innerHTML,
        timestamp: new Date().getTime()
    };

    localStorage.setItem('buromaster_v3_data', JSON.stringify(donnees));
    
    // Feedback visuel
    const status = document.getElementById('status-save');
    if (status) {
        status.innerHTML = '<i class="fas fa-check-double"></i> Document synchronisé';
        setTimeout(() => {
            status.innerHTML = '<i class="fas fa-cloud-check"></i> Sauvegardé';
        }, 3000);
    }
}

function chargerSession() {
    const rawData = localStorage.getItem('buromaster_v3_data');
    if (rawData) {
        const donnees = JSON.parse(rawData);
        if (donnees.html) document.getElementById('main-container').innerHTML = donnees.html;
        if (donnees.titre) document.getElementById('doc-title').innerText = donnees.titre;
    }
}

/**
 * GESTION DE L'IMPRESSION (PDF)
 */
function preparerEtImprimer() {
    const titre = document.getElementById('doc-title').innerText;
    document.title = titre; // Le nom du fichier PDF sera le titre de l'épreuve
    window.print();
}

/**
 * RÉINITIALISATION
 */
function reinitialiserEditeur() {
    if (confirm("⚠️ ATTENTION : Voulez-vous supprimer toute l'épreuve actuelle ?")) {
        localStorage.removeItem('buromaster_v3_data');
        location.reload();
    }
}

/**
 * UTILITAIRE : DEBOUNCE (Évite de sauvegarder à chaque lettre tapée)
 */
let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(sauvegarderSession, 2000);
}

/**
 * BANQUE D'IMAGES (Vecteurs et schémas)
 */
const BANQUE_SCHEMAS = [
    { nom: "Bécher", url: "https://cdn-icons-png.flaticon.com" },
    { nom: "Atome", url: "https://cdn-icons-png.flaticon.com" },
    { nom: "Bénin", url: "https://cdn-icons-png.flaticon.com" }
];

function ouvrirBanqueImages() {
    let modale = document.createElement('div');
    modale.className = "modale-images";
    modale.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999;";
    
    let content = `
        <div style="background:white; padding:25px; border-radius:12px; width:80%; max-width:600px; max-height:80vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;">📁 Banque de schémas</h3>
                <button onclick="this.closest('.modale-images').remove()" style="cursor:pointer; border:none; background:none; font-size:1.5rem;">&times;</button>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:15px;">
                ${BANQUE_SCHEMAS.map(img => `
                    <div style="text-align:center; cursor:pointer;" onclick="insererSchema('${img.url}')">
                        <img src="${img.url}" style="width:100%; border:1px solid #eee; border-radius:8px; padding:10px;">
                        <small style="display:block; margin-top:5px;">${img.nom}</small>
                    </div>
                `).join('')}
            </div>
        </div>`;
    
    modale.innerHTML = content;
    document.body.appendChild(modale);
}

window.insererSchema = function(url) {
    const imgHTML = `<img src="${url}" style="width:150px; height:auto; display:block; margin:10px auto;">`;
    const zone = obtenirPageActive();
    zone.focus();
    document.execCommand('insertHTML', false, imgHTML);
    document.querySelector('.modale-images').remove();
};
