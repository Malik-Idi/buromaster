document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const pagesContainer = document.getElementById("preview-pages");
    const themeInput = document.getElementById("theme");


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
        // On réinitialise l'aperçu
        pagesContainer.innerHTML = "";
        let pageNum = 1;
        let currentPage = createNewPage(pageNum);

        const lines = editor.value.split("\n");

        lines.forEach(lineText => {
            const div = document.createElement("div");
            // Gérer les lignes vides
            div.textContent = lineText.trim() === "" ? "\u00A0" : lineText.trim();

            // Attribution des styles selon le début de la ligne
            if (/^[IVX]+\./.test(lineText)) {
                div.className = "title-style";
            } else if (/^[A-Z]\./.test(lineText.trim())) {
                div.className = "subtitle-style";
            } else {
                div.className = "text-style";
            }

            currentPage.appendChild(div);

            const pageElement = currentPage.closest(".preview-sheet");

            if (pageElement.scrollHeight > pageElement.clientHeight) {
                currentPage.removeChild(div);
                pageNum++;
                currentPage = createNewPage(pageNum);
                currentPage.appendChild(div);
            }

        });
    }

    // Événements de frappe
    editor.addEventListener("input", updatePreview);
    themeInput.addEventListener("input", updatePreview);

    // Contrôles du Zoom
    document.querySelectorAll(".zoom-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.getAttribute("data-zoom");
            pagesContainer.style.zoom = val;
        });
    });

    // Modèle de plan
    document.getElementById("generatePlan").addEventListener("click", () => {
        editor.value = "I. INTRODUCTION\n\nII. DÉVELOPPEMENT\n   A. Première idée\n   B. Deuxième idée\n\nIII. CONCLUSION";
        updatePreview();
    });

    // Téléchargement PDF
    document.getElementById("downloadPdf").addEventListener("click", () => {
        const element = document.getElementById("preview-pages");
        const opt = {
            margin: 0,
            filename: `Expose_${themeInput.value || 'BuroMaster'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });

    // Initialisation
    updatePreview();
});
