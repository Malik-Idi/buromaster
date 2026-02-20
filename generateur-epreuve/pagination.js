/**
 * BUROMASTER - Moteur de Pagination Holistique (V4)
 * Gère : Flux Avant, Flux Arrière, Renumérotation et Sécurité Images
 */

let isPaginating = false;

/**
 * 1. SYNC DES NUMÉROS DE PAGE
 */
function renumeroterPages() {
    const pages = document.querySelectorAll('.a4-page');
    pages.forEach((page, index) => {
        const footer = page.querySelector('.page-footer');
        if (footer) footer.innerText = `BuroMaster | Page ${index + 1}`;
    });
}

/**
 * 2. CRÉATION DE PAGE
 */
function creerNouvellePage() {
    const container = document.getElementById('main-container');
    const nouvellePage = document.createElement('div');
    nouvellePage.className = "a4-page";
    
    const zoneTexte = document.createElement('div');
    zoneTexte.className = "page-content";
    zoneTexte.contentEditable = "true";
    zoneTexte.setAttribute('spellcheck', 'true');

    const footer = document.createElement('div');
    footer.className = "page-footer";
    footer.contentEditable = "false";

    nouvellePage.appendChild(zoneTexte);
    nouvellePage.appendChild(footer);
    container.appendChild(nouvellePage);

    renumeroterPages();
    return zoneTexte;
}

/**
 * 3. MOTEUR DE FLUX (AVANT ET ARRIÈRE)
 */
function ajusterLeFlux(event) {
    if (isPaginating) return;
    isPaginating = true;

    const activeZone = event ? event.target.closest('.page-content') : document.querySelector('.page-content');
    if (!activeZone) { isPaginating = false; return; }

    // --- SÉCURITÉ A : DÉPASSEMENT (Vers l'avant) ---
    let safetyForward = 0;
    while (activeZone.scrollHeight > activeZone.clientHeight && safetyForward < 20) {
        safetyForward++;
        const dernierEl = activeZone.lastElementChild;
        if (!dernierEl) break;

        const pageSuivante = activeZone.closest('.a4-page').nextElementSibling;
        const zoneSuivante = pageSuivante ? pageSuivante.querySelector('.page-content') : creerNouvellePage();
        
        zoneSuivante.prepend(dernierEl);
    }

    // --- SÉCURITÉ B : ASPIRATION (Vers l'arrière / Reverse Flow) ---
    // Si la page actuelle a de la place, on regarde si la page suivante a du contenu à remonter
    const pageSuivante = activeZone.closest('.a4-page').nextElementSibling;
    if (pageSuivante) {
        const zoneSuivante = pageSuivante.querySelector('.page-content');
        let safetyBackward = 0;
        
        while (zoneSuivante.firstElementChild && safetyBackward < 20) {
            const premierElSuivant = zoneSuivante.firstElementChild;
            activeZone.appendChild(premierElSuivant);

            // Si ça dépasse après l'ajout, on le rend à la page suivante et on arrête
            if (activeZone.scrollHeight > activeZone.clientHeight) {
                zoneSuivante.prepend(premierElSuivant);
                break;
            }
            safetyBackward++;
        }

        // Si la page suivante est devenue totalement vide après l'aspiration
        if (zoneSuivante.innerHTML.trim() === "" || zoneSuivante.innerHTML === "<br>") {
            pageSuivante.remove();
            renumeroterPages();
        }
    }

    isPaginating = false;
}

/**
 * 4. GESTION DU CURSEUR ET SUPPRESSION
 */
function gererTouches(e) {
    if (e.key === "Backspace") {
        setTimeout(() => ajusterLeFlux(), 10);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('main-container');
    if (container) {
        container.addEventListener('input', (e) => ajusterLeFlux(e));
        container.addEventListener('keydown', gererTouches);
    }
    renumeroterPages();
});
