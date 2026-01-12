document.addEventListener("DOMContentLoaded", function () {
    const generateBtn = document.getElementById("generatePlan");
    const editor = document.getElementById("editor");
    const preview = document.getElementById("preview-content");
    const themeInput = document.getElementById("theme");
    const docTitle = document.getElementById("doc-title");
    const previewSheet = document.querySelector(".preview-sheet");
    const zoomButtons = document.querySelectorAll(".zoom-controls button");
    const pdfBtn = document.getElementById("downloadPdf");

    // Mise à jour de l'aperçu texte
    function updatePreview() {
        preview.innerHTML = "<h3>PLAN</h3>";
        const lines = editor.value.split("\n");
        lines.forEach(line => {
            if (line.trim() === "") return;
            const p = document.createElement("p");
            p.textContent = line.trim();
            if (/^[IVX]+\./.test(line)) { p.style.fontWeight = "bold"; p.style.marginTop = "10px"; }
            preview.appendChild(p);
        });
    }

    // Bouton Générer
    generateBtn.addEventListener("click", () => {
        editor.value = "I. Introduction\nII. Développement\nIII. Conclusion";
        updatePreview();
    });

    // Écouteur clavier
    editor.addEventListener("input", updatePreview);

    // Titre dynamique
    themeInput.addEventListener("input", () => {
        docTitle.textContent = themeInput.value ? "EXPOSÉ : " + themeInput.value.toUpperCase() : "EXPOSÉ";
    });

    // Zoom
    zoomButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            previewSheet.style.transform = `scale(${btn.getAttribute("data-zoom")})`;
            previewSheet.style.transformOrigin = "top center";
        });
    });

    // TÉLÉCHARGEMENT PDF
    pdfBtn.addEventListener("click", () => {
        const element = document.getElementById("pdf-content");
        const options = {
            filename: 'mon-expose.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(options).from(element).save();
    });

    updatePreview(); // Lancer une fois au démarrage
});
