document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const pagesContainer = document.getElementById("preview-pages");
    const themeInput = document.getElementById("theme");
    const generateBtn = document.getElementById("generatePlan"); // Le bouton manquant

    // Hauteur max d'une page A4 en pixels (environ)
    const MAX_PAGE_HEIGHT = 900; 

    // --- 1. FONCTION DE GÉNÉRATION DE MODÈLE ---
    generateBtn.addEventListener("click", function() {
        const theme = themeInput.value || "Mon exposé";
        const modele = `I. Introduction
A. Présentation du sujet : ${theme}
B. Problématique
C. Annonce du plan

II. Développement - Axe 1
A. Premier argument
B. Deuxième argument

III. Développement - Axe 2
A. Premier argument
B. Deuxième argument

IV. Conclusion
A. Synthèse des idées
B. Ouverture`;

        editor.value = modele; // Remplit l'éditeur
        updatePreview();       // Met à jour l'aperçu A4 immédiatement
    });

    // --- 2. LOGIQUE DE L'APERÇU A4 ---
    function createNewPage(num) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        page.innerHTML = `
            <div class="page-header">
                <div class="doc-title-text">${themeInput.value ? "EXPOSÉ : " + themeInput.value.toUpperCase() : "EXPOSÉ"}</div>
            </div>
            <div class="page-content"></div>
            <div class="page-footer">Page ${num}</div>
        `;
        pagesContainer.appendChild(page);
        return page.querySelector(".page-content");
    }

    function updatePreview() {
        pagesContainer.innerHTML = "";
        let pageNum = 1;
        let currentPage = createNewPage(pageNum);

        const lines = editor.value.split("\n");

        lines.forEach(lineText => {
            if (lineText.trim() === "" && lines.length === 1) return;

            const div = document.createElement("div");
            div.textContent = lineText.trim() === "" ? "\u00A0" : lineText;

            // Détection des styles (I. ou A.)
            if (/^[IVX]+\./.test(lineText.trim())) {
                div.className = "title-style";
            } else if (/^[A-Z]\./.test(lineText.trim())) {
                div.className = "subtitle-style";
            } else {
                div.className = "text-style";
            }

            currentPage.appendChild(div);

            // Vérification du saut de page
            if (currentPage.scrollHeight > MAX_PAGE_HEIGHT) {
                currentPage.removeChild(div); 
                pageNum++;
                currentPage = createNewPage(pageNum);
                currentPage.appendChild(div);
            }
        });
    }

    // --- 3. ÉCOUTEURS D'ÉVÉNEMENTS ---
    editor.addEventListener("input", updatePreview);
    themeInput.addEventListener("input", updatePreview);

    // Initialisation
    updatePreview();
});
