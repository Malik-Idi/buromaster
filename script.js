document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const pagesContainer = document.getElementById("preview-pages");
    const themeInput = document.getElementById("theme");

    // Ajustement de la sensibilité du saut de page
    // 950px est généralement la limite de sécurité pour une page A4 avec padding
    const MAX_PAGE_HEIGHT = 950; 

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

        // On ne traite les lignes que s'il y a du texte
        if (editor.value.trim() === "" && themeInput.value.trim() === "") {
            return; // Garde une seule page vide propre
        }

        const lines = editor.value.split("\n");

        lines.forEach(lineText => {
            const div = document.createElement("div");
            div.textContent = lineText.trim() === "" ? "\u00A0" : lineText.trim();

            if (/^[IVX]+\./.test(lineText)) div.className = "title-style";
            else if (/^[A-Z]\./.test(lineText.trim())) div.className = "subtitle-style";
            else div.className = "text-style";

            currentPage.appendChild(div);

            // LOGIQUE DE SAUT DE PAGE
            // On vérifie si la hauteur réelle du contenu dépasse la limite
            if (currentPage.scrollHeight > MAX_PAGE_HEIGHT) {
                currentPage.removeChild(div); 
                pageNum++;
                currentPage = createNewPage(pageNum);
                currentPage.appendChild(div);
            }
        });
    }

    editor.addEventListener("input", updatePreview);
    themeInput.addEventListener("input", updatePreview);

    // Initialisation forcée au démarrage (une seule page)
    updatePreview();
});
