/**
 * BUROMASTER - Module de gestion des En-têtes (Afrique de l'Ouest)
 */

const BANQUE_ENTETES = {
    "benin": {
        "devoir_officiel": `
            <div class="header-epreuve" style="border-bottom: 3px double black; padding-bottom: 10px; text-align:center; width:100%; display:block;">
                <p style="font-weight: bold; margin: 0; font-size: 1.1em;">RÉPUBLIQUE DU BÉNIN</p>
                <p style="margin: 5px 0; font-size: 0.85em;">MINISTÈRE DE L'ENSEIGNEMENT SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE</p>
                <p style="font-style: italic; font-size: 0.75em; margin-bottom: 10px;">Travail - Justice - Paix</p>
                
                <div style="display: flex; justify-content: space-between; text-align: left; font-size: 0.9em; border-top: 1px solid #000; padding-top: 10px;">
                    <div>
                        <strong>DIRECTION DÉPARTEMENTALE :</strong> .....................<br>
                        <strong>ÉTABLISSEMENT :</strong> ............................................<br>
                        <strong>ANNÉE SCOLAIRE :</strong> 2024-2025
                    </div>
                    <div style="text-align: right;">
                        <strong>CLASSE :</strong> ....................<br>
                        <strong>SÉRIE :</strong> .....................<br>
                        <strong>DURÉE :</strong> .....................
                    </div>
                </div>
            </div>`,

        "examen_blanc": `
            <div class="header-epreuve" style="border: 2px solid black; padding: 15px; width:100%; display:block;">
                <div style="text-align: center; border-bottom: 1px solid black; padding-bottom: 10px; margin-bottom: 10px;">
                    <h2 style="margin: 0; text-transform: uppercase;">Examen Blanc Départemental</h2>
                    <p style="margin: 5px 0;">Session de Mai 2025</p>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>ÉPREUVE : ..............................</span>
                    <span>COEF : .......</span>
                </div>
            </div>`,

        "interro_simple": `
            <div class="header-epreuve" style="border-left: 5px solid black; padding-left: 15px; margin-bottom: 20px; width:100%; display:block;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <p><strong>NOM :</strong> ..........................................</p>
                        <p><strong>PRÉNOMS :</strong> .................................</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>CLASSE :</strong> ..........</p>
                        <p><strong>DATE :</strong> ..../..../2025</p>
                    </div>
                </div>
                <h3 style="text-align: center; margin-top: 10px; text-decoration: underline;">INTERROGATION ÉCRITE</h3>
            </div>`
    },
    "togo": {
        "standard": `
            <div class="header-epreuve" style="text-align: center; width:100%; display:block;">
                <p>RÉPUBLIQUE TOGOLAISE</p>
                <p>Travail - Liberté - Patrie</p>
                <hr>
            </div>`
    }
};

function appliquerEntete(pays, type) {
    const zone = document.getElementById('epreuve-zone');
    const htmlEntete = BANQUE_ENTETES[pays][type];
    
    const ancienHeader = zone.querySelector('.header-epreuve');
    if (ancienHeader) {
        ancienHeader.outerHTML = htmlEntete;
    } else {
        zone.insertAdjacentHTML('afterbegin', htmlEntete);
    }
}
