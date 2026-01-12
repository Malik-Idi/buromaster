document.addEventListener("DOMContentLoaded", function () {
    // Sélecteurs
    const generateBtn = document.getElementById("generatePlan");
    const editor = document.getElementById("editor");
    const preview = document.getElementById("preview-content"); // Corrigé : l'ID du HTML est preview-content
    const themeInput = document.getElementById("theme");
    const docTitle = document.getElementById("doc-title");
    const previewSheet = document.querySelector(".preview-sheet");
    const zoomButtons = document.querySelectorAll(".zoom-controls button");

    // Fonction de mise à jour de l'aperçu
    function updatePreview() {
        preview.innerHTML = "<h3>PLAN</h3>"; // Réinitialise avec le titre

        const lines = editor.value.split("\n");

        lines.forEach(line => {
            if (line.trim() === "") return;

            const p = document.createElement("p");
            p.textContent = line.trim();

            // Logique de stylisation dynamique
            if (/^[IVX]+\./.test(line)) {
                p.style.fontWeight = "bold";
                p.style.textTransform = "uppercase";
                p.style.marginTop = "15px";
            } else if (/^[A-Z]\./.test(line.trim())) {
                p.style.paddingLeft = "20px";
                p.style.fontStyle = "italic";
            } else {
                p.style.paddingLeft = "40px";
            }

            preview.appendChild(p);
        });
    }

    // Bouton Générer
    generateBtn.addEventListener("click", function () {
        editor.value = `I. Introduction
II. Causes du sujet
   A. Première cause
   B. Deuxième cause
III. Conséquences
   A. Première conséquence
   B. Deuxième conséquence
IV. Solutions
V. Conclusion`;
        updatePreview();
    });

    // Écouteur sur l'éditeur
    editor.addEventListener("input", updatePreview);

    // Mise à jour du titre via le thème
    themeInput.addEventListener("input", () => {
        docTitle.textContent = themeInput.value.trim() !== "" 
            ? "EXPOSÉ : " + themeInput.value.toUpperCase() 
            : "EXPOSÉ";
    });

    // Gestion du Zoom
    zoomButtons.forEach(button => {
        button.addEventListener("click", () => {
            const zoom = button.getAttribute("data-zoom");
            previewSheet.style.transform = `scale(${zoom})`;
            previewSheet.style.transformOrigin = "top center";
        });
    });

    // Lancement initial
    updatePreview();
});
