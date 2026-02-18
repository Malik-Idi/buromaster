/**
 * BUROMASTER - Module d'Édition et Mise en Forme
 * Gère le texte, les alignements et les interactions
 */

// --- FONCTION CERVEAU : TROUVER LA ZONE DE TEXTE ACTIVE ---
function obtenirPageActive() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node && node !== document.body) {
            if (node.classList && node.classList.contains('page-content')) {
                return node;
            }
            node = node.parentNode;
        }
    }
    // Fallback : On prend la dernière page si aucune n'est ciblée
    const pages = document.querySelectorAll('.page-content');
    return pages[pages.length - 1];
}

// --- FONCTION DE MISE EN FORME (DÉLÉGATION) ---
function formater(commande, valeur = null) {
    const zone = obtenirPageActive();
    if (zone) {
        zone.focus();
        document.execCommand(commande, false, valeur);
    }
}

// --- LIAISON DES BOUTONS DE LA SIDEBAR DROITE ---
document.addEventListener('DOMContentLoaded', () => {
    // Styles de texte
    const mapping = {
        'fmt-bold': 'bold',
        'fmt-italic': 'italic',
        'fmt-underline': 'underline',
        'fmt-strike': 'strikethrough',
        'fmt-left': 'justifyLeft',
        'fmt-center': 'justifyCenter',
        'fmt-right': 'justifyRight',
        'fmt-full': 'justifyFull',
        'fmt-ul': 'insertUnorderedList',
        'fmt-ol': 'insertOrderedList'
    };

    for (const [id, cmd] of Object.entries(mapping)) {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = () => formater(cmd);
    }

    // Effacer la mise en forme
    const btnClear = document.getElementById('fmt-clear');
    if (btnClear) {
        btnClear.onclick = () => {
            formater('removeFormat');
            const zone = obtenirPageActive();
            if (zone) {
                zone.style.backgroundColor = "transparent";
                zone.style.padding = "20mm"; // Reset padding standard
            }
        };
    }

    // Retraits
    const btnIndent = document.getElementById('fmt-indent');
    const btnOutdent = document.getElementById('fmt-outdent');
    if (btnIndent) btnIndent.onclick = () => formater('indent');
    if (btnOutdent) btnOutdent.onclick = () => formater('outdent');

    // Couleurs
    const textColor = document.getElementById('text-color-picker');
    const bgColor = document.getElementById('bg-color-picker');
    if (textColor) textColor.onchange = (e) => formater('foreColor', e.target.value);
    if (bgColor) bgColor.onchange = (e) => {
        const zone = obtenirPageActive();
        if (zone) zone.style.backgroundColor = e.target.value;
    };
});

// --- LOGIQUE DE SUPPRESSION DE PAGE (REVERSE FLOW) ---
document.addEventListener('keydown', (e) => {
    const zone = obtenirPageActive();
    // Si on appuie sur Retour arrière dans une page vide (sauf la première)
    if (e.key === "Backspace" && zone) {
        const pages = document.querySelectorAll('.a4-page');
        const pageContainer = zone.closest('.a4-page');
        
        if (zone.innerHTML.trim() === "" && pages.length > 1 && pageContainer !== pages[0]) {
            e.preventDefault();
            const pagePrecedente = pageContainer.previousElementSibling;
            if (pagePrecedente) {
                const zonePrecedente = pagePrecedente.querySelector('.page-content');
                pageContainer.remove();
                zonePrecedente.focus();
                // Placer le curseur à la fin de la page précédente
                const range = document.createRange();
                range.selectNodeContents(zonePrecedente);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
});
