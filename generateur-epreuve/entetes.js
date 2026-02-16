/**
 * BUROMASTER - Module de gestion des En-têtes (Afrique de l'Ouest)
 */

const BANQUE_ENTETES = {
    "benin": {
        "devoir_officiel": `
            <div class="header-epreuve" style="border-bottom: 3px double black; padding-bottom: 10px;">
                <div style="text-align: center; width: 100%;">
                    <p style="font-weight: bold; margin: 0;">RÉPUBLIQUE DU BÉNIN</p>
                    <p style="margin: 5px 0;">MINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE</p>
                    <p style="font-style: italic; font-size: 0.8em;">Travail - Justice - Paix</p>
                    <div style="display: flex; justify-content: space-between; margin-top: 15px; text-align: left;">
                        <div>Établissement : ........................<br>Année : 2024-2025</div>
                        <div>Classe : ............<br>Série : ............</div>
                    </div>
                </div>
            </div>`,
        "interro_simple": `
            <div class="header-epreuve" style="border: 1px solid black; padding: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <p><strong>Nom & Prénoms :</strong> ............................................................</p>
                    <p><strong>Classe :</strong> .......</p>
                </div>
                <p style="text-align: center; font-weight: bold; text-decoration: underline; margin-top: 10px;">INTERROGATION ÉCRITE N°....</p>
            </div>`
    },
    "togo": {
        "standard": `<p style="text-align: center;">RÉPUBLIQUE TOGOLAISE...</p>`
    }
};

/**
 * Fonction pour injecter l'en-tête choisi
 * @param {string} pays - ex: 'benin'
 * @param {string} type - ex: 'devoir_officiel'
 */
function appliquerEntete(pays, type) {
    const zone = document.getElementById('epreuve-zone');
    const htmlEntete = BANQUE_ENTETES[pays][type];
    
    // On cherche si un en-tête existe déjà pour le remplacer, sinon on l'ajoute au début
    const ancienHeader = zone.querySelector('.header-epreuve');
    if (ancienHeader) {
        ancienHeader.outerHTML = htmlEntete;
    } else {
        zone.insertAdjacentHTML('afterbegin', htmlEntete);
    }
}
