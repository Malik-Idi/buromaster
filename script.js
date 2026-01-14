document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const pagesContainer = document.getElementById("preview-pages");
    const themeInput = document.getElementById("theme");

    // On définit la hauteur max utilisable à l'intérieur de .page-content (en pixels environ)
    const MAX_CONTENT_HEIGHT = 880; 

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
            const div = document.createElement("div");
            // Gestion du texte vide pour garder l'espace
            div.textContent = lineText.trim() === "" ? "\u00A0" : lineText;

            // Attribution des classes
            if (/^[IVX]+\./.test(lineText.trim())) {
                div.className = "title-style";
            } else if (/^[A-Z]\./.test(lineText.trim())) {
                div.className = "subtitle-style";
            } else {
                div.className = "text-style";
            }

            currentPage.appendChild(div);

            // Vérification du dépassement
            if (currentPage.offsetHeight > MAX_CONTENT_HEIGHT) {
                currentPage.removeChild(div); 
                pageNum++;
                currentPage = createNewPage(pageNum);
                currentPage.appendChild(div);
            }
        });
    }

    // Écouteurs d'événements
    editor.addEventListener("input", updatePreview);
    themeInput.addEventListener("input", updatePreview);
    
    // Bouton de téléchargement PDF (Fonctionnel)
    document.getElementById("downloadPdf").addEventListener("click", () => {
        const element = document.getElementById("preview-pages");
        const opt = {
            margin: 0,
            filename: 'expose.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });

    updatePreview();
});
