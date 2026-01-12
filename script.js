document.addEventListener("DOMContentLoaded", function () {
    const editor = document.getElementById("editor");
    const preview = document.getElementById("preview-content");
    const themeInput = document.getElementById("theme");
    const docTitle = document.getElementById("doc-title");
    const previewSheet = document.querySelector(".preview-sheet");
    
    // Mise à jour de l'aperçu
    function updatePreview() {
        preview.innerHTML = "<h3 style='text-align:center; text-decoration:underline;'>PLAN</h3>";
        const lines = editor.value.split("\n");
        lines.forEach(line => {
            if (line.trim() === "") return;
            const span = document.createElement("span");
            span.textContent = line.trim();
            
            if (/^[IVX]+\./.test(line)) span.className = "title";
            else if (/^[A-Z]\./.test(line.trim())) span.className = "subtitle";
            else span.className = "text";
            
            preview.appendChild(span);
            preview.appendChild(document.createElement("br"));
        });
    }

    // Événements
    editor.addEventListener("input", updatePreview);
    themeInput.addEventListener("input", () => {
        docTitle.textContent = themeInput.value ? "EXPOSÉ : " + themeInput.value.toUpperCase() : "EXPOSÉ";
    });

    // Bouton Modèle
    document.getElementById("generatePlan").addEventListener("click", () => {
        editor.value = "I. Introduction\nII. Développement\n   A. Première partie\n   B. Deuxième partie\nIII. Conclusion";
        updatePreview();
    });

    // Zoom
    document.querySelectorAll(".zoom-controls button").forEach(btn => {
        btn.addEventListener("click", () => {
            previewSheet.style.transform = `scale(${btn.getAttribute("data-zoom")})`;
        });
    });

    // Téléchargement PDF (Fonctionne sur Android et PC)
    document.getElementById("downloadPdf").addEventListener("click", () => {
        const originalTransform = previewSheet.style.transform;
        previewSheet.style.transform = "scale(1)"; // On remet à 100% pour le PDF
        
        const options = {
            margin: 10,
            filename: 'mon-expose-buromaster.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(document.getElementById("pdf-content")).save().then(() => {
            previewSheet.style.transform = originalTransform; // On remet le zoom d'origine après
        });
    });

    // Validation
    document.getElementById("validatePlan").addEventListener("click", () => alert("Plan enregistré !"));

    updatePreview();
});
