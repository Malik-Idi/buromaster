document.addEventListener("DOMContentLoaded", function () {
    // Éléments HTML
    const editor = document.getElementById("editor");
    const themeInput = document.getElementById("theme");
    const pagesContainer = document.getElementById("preview-pages");
    const generateBtn = document.getElementById("generatePlan");
    const validateBtn = document.getElementById("validatePlan");
    const nextBtn = document.getElementById("nextStep");
    const downloadBtn = document.getElementById("downloadPdf");

    const MAX_PAGE_HEIGHT = 920; // Limite de pixels par page
    let isLocked = false;

    // --- 1. GESTION DE L'APERÇU ---
    function createNewPage(num) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        page.innerHTML = `
            <div class="page-header">
                <div class="doc-title-text">${themeInput.value ? "EXPOSÉ : " + themeInput.value.toUpperCase() : "VOTRE EXPOSÉ"}</div>
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
            const div = document.createElement("div");
            div.textContent = lineText.trim() === "" ? "\u00A0" : lineText;

            // Détection du style par ligne
            if (/^[IVX]+\./.test(lineText.trim())) div.className = "title-style";
            else if (/^[A-Z]\./.test(lineText.trim())) div.className = "subtitle-style";
            else div.className = "text-style";

            currentPage.appendChild(div);

            // Saut de page automatique
            if (currentPage.scrollHeight > MAX_PAGE_HEIGHT) {
                currentPage.removeChild(div);
                pageNum++;
                currentPage = createNewPage(pageNum);
                currentPage.appendChild(div);
            }
        });
    }

    // --- 2. BOUTON GÉNÉRER MODÈLE ---
    generateBtn.addEventListener("click", () => {
        const theme = themeInput.value || "Sujet de l'exposé";
        editor.value = `I. INTRODUCTION\nA. Présentation du sujet : ${theme}\nB. Problématique\nC. Annonce du plan\n\nII. DÉVELOPPEMENT\nA. Premier axe d'analyse\nB. Deuxième axe d'analyse\n\nIII. CONCLUSION\nA. Synthèse des résultats\nB. Ouverture du sujet`;
        updatePreview();
    });

    // --- 3. BOUTON VALIDER / MODIFIER ---
    validateBtn.addEventListener("click", () => {
        if (!isLocked) {
            // Mode verrouillé
            editor.readOnly = true;
            generateBtn.disabled = true;
            validateBtn.textContent = "Modifier le Plan";
            validateBtn.style.background = "#ff9800";
            nextBtn.style.display = "block"; // Affiche le bouton suivant
            isLocked = true;
        } else {
            // Mode édition
            editor.readOnly = false;
            generateBtn.disabled = false;
            validateBtn.textContent = "Valider ce plan";
            validateBtn.style.background = "#4CAF50";
            nextBtn.style.display = "none"; // Cache le bouton suivant
            isLocked = false;
        }
    });

    // --- 4. EXPORT PDF ---
    downloadBtn.addEventListener("click", () => {
        const opt = {
            margin: 0,
            filename: 'mon_expose_plan.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(pagesContainer).save();
    });

    // Écouteurs pour mise à jour en direct
    editor.addEventListener("input", updatePreview);
    themeInput.addEventListener("input", updatePreview);

    // Lancer l'aperçu au démarrage
    updatePreview();
});
