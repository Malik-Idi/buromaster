/**
 * BUROMASTER - Module d'Édition Avancé (Version Blindée)
 * Gère la mise en forme, les composants complexes et les interactions
 */

// --- 1. MOTEUR DE SÉLECTION ---

function obtenirPageActive() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node && node !== document.body) {
            if (node.nodeType === 1 && node.classList.contains('page-content')) {
                return node;
            }
            node = node.parentNode;
        }
    }
    return document.querySelector('.page-content:last-of-type');
}

// Fonction pour appliquer une commande de manière robuste
function executer(commande, valeur = null) {
    const zone = obtenirPageActive();
    if (zone) {
        zone.focus();
        document.execCommand(commande, false, valeur);
        
        // Déclencher manuellement l'input pour que pagination.js réagisse
        const event = new Event('input', { bubbles: true });
        zone.dispatchEvent(event);
    }
}

// --- 2. GESTION DES COMPOSANTS COMPLEXES (Professeurs) ---

const EditeurComposants = {
    // Insérer un bloc d'exercice proprement
    insererExercice() {
        const zone = obtenirPageActive();
        const nbEx = zone.querySelectorAll('.ex-title').length + 1;
        const html = `
            <div class="exercice-container" style="margin-top: 15px;">
                <p class="ex-title"><strong>Exercice ${nbEx} (........ points)</strong></p>
                <p>Énoncez l'exercice ici...</p>
            </div><p><br></p>`;
        executer('insertHTML', html);
    },

    // Insérer un tableau scolaire standard
    insererTableau() {
        const rows = prompt("Nombre de lignes ?", "3");
        const cols = prompt("Nombre de colonnes ?", "3");
        if (!rows || !cols) return;

        let tableHTML = '<table style="width:100%; border-collapse:collapse; margin:10px 0;">';
        for (let i = 0; i < rows; i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHTML += '<td style="border:1px solid black; padding:5px; height:20px;"></td>';
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</table><p><br></p>';
        executer('insertHTML', tableHTML);
    },

    // Insérer une équation MathLive
    insererEquation() {
        const latex = prompt("Entrez votre formule (LaTeX) :", "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");
        if (latex) {
            const mathHTML = `<span contenteditable="false" style="display:inline-block; padding:0 5px;">
                <math-field read-only style="border:none; background:transparent;">${latex}</math-field>
            </span>&nbsp;`;
            executer('insertHTML', mathHTML);
        }
    }
};

// --- 3. INITIALISATION ET BINDING ---

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mapping des commandes standards ---
    const boutonsMiseEnForme = {
        'fmt-bold': 'bold',
        'fmt-italic': 'italic',
        'fmt-underline': 'underline',
        'fmt-strike': 'strikethrough',
        'fmt-left': 'justifyLeft',
        'fmt-center': 'justifyCenter',
        'fmt-right': 'justifyRight',
        'fmt-full': 'justifyFull',
        'fmt-ul': 'insertUnorderedList',
        'fmt-ol': 'insertOrderedList',
        'fmt-indent': 'indent',
        'fmt-outdent': 'outdent'
    };

    // Liaison automatique des IDs aux commandes
    Object.entries(boutonsMiseEnForme).forEach(([id, cmd]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                executer(cmd);
            });
        }
    });

    // --- Gestion des Couleurs et Tailles ---
    const textColor = document.getElementById('text-color-picker');
    if (textColor) {
        textColor.addEventListener('input', (e) => executer('foreColor', e.target.value));
    }

    const selectSize = document.getElementById('select-size');
    if (selectSize) {
        selectSize.addEventListener('change', (e) => {
            // Note: execCommand fontSize utilise des valeurs de 1 à 7
            executer('fontSize', e.target.value);
        });
    }

    // --- Gestion Spéciale : Gomme / Nettoyage ---
    const btnClear = document.getElementById('fmt-clear');
    if (btnClear) {
        btnClear.addEventListener('click', (e) => {
            e.preventDefault();
            executer('removeFormat');
        });
    }

    // --- Liaison des boutons de structure (Gauche) ---
    const btnExo = document.getElementById('btn-exercice');
    if (btnExo) btnExo.onclick = () => EditeurComposants.insererExercice();

    const btnTableau = document.getElementById('btn-tableau');
    if (btnTableau) btnTableau.onclick = () => EditeurComposants.insererTableau();

    const btnMaths = document.getElementById('btn-maths');
    if (btnMaths) btnMaths.onclick = () => EditeurComposants.insererEquation();

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.onclick = () => {
            if (confirm("⚠️ VOULEZ-VOUS TOUT EFFACER ? Cette action est irréversible.")) {
                location.reload();
            }
        };
    }
});
