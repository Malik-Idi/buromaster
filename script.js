document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const pagesContainer = document.getElementById("preview-pages");
    const themeInput = document.getElementById("theme");

    // Paramètres de la page A4 (en pixels pour le calcul)
    const PAGE_HEIGHT_PX = 1050; // Hauteur max du contenu avant de sauter de page

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
        // 1. On vide tout avant de recalculer
        pagesContainer.innerHTML = "";
        let currentPageNumber = 1;
        let currentPageContent = createNewPage(currentPageNumber);

        // 2. On découpe le texte par lignes
        const lines = editor.value.split("\n");

        lines.forEach(lineText => {
            // Création d'un élément temporaire pour tester la hauteur
            const lineElement = document.createElement("div");
            lineElement.style.wordWrap = "break-word";
            lineElement.textContent = lineText.trim() === "" ? "\u00A0" : lineText.trim();

            // Application des styles selon le type de ligne
            if (/^[IVX]+\./.test(lineText)) lineElement.className = "title-style";
            else if (/^[A-Z]\./.test(lineText.trim())) lineElement.className = "subtitle-style";
            else lineElement.className = "text-style";

            // 3. On ajoute la ligne à la page actuelle
            currentPageContent.appendChild(lineElement);

            // 4. VERIFICATION DU DEBORDEMENT
            // Si la hauteur du contenu dépasse la limite A4
            if (currentPageContent.scrollHeight > PAGE_HEIGHT_PX) {
                // On retire la ligne de la page pleine
                currentPageContent.removeChild(lineElement);
                
                // On crée une nouvelle page
                currentPageNumber++;
                currentPageContent = createNewPage(currentPageNumber);
                
                // On ajoute la ligne sur la nouvelle page
                currentPageContent.appendChild(lineElement);
            }
        });
    }

    // --- ÉVÉNEMENTS ---

    // Met à jour l'aperçu dès qu'on tape
    editor.addEventListener("input", updatePreview);
    
    // Met à jour le titre sur toutes les pages quand le thème change
    themeInput.addEventListener("input", updatePreview);

    // Zoom
    document.querySelectorAll(".zoom-controls button").forEach(btn => {
        btn.addEventListener("click", () => {
            const scale = btn.getAttribute("data-zoom");
            pagesContainer.style.transform = `scale(${scale})`;
            pagesContainer.style.transformOrigin = "top center";
        });
    });

    // Générer un modèle
    document.getElementById("generatePlan").addEventListener("click", () => {
        editor.value = "I. Introduction\nCeci est un texte de test pour voir le saut de page automatique...\n\nII. Développement\n" + "Ligne de remplissage\n".repeat(40) + "III. Conclusion";
        updatePreview();
    });

    // PDF
    document.getElementById("downloadPdf").addEventListener("click", () => {
        const element = document.getElementById("preview-pages");
        const opt = {
            margin: 0,
            filename: 'mon-expose.pdf',
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });

    updatePreview();
});
