document.addEventListener("DOMContentLoaded", function () {
    // Sélecteurs
    const generateBtn = document.getElementById("generatePlan");
    const editor = document.getElementById("editor");
    const preview = document.getElementById("preview-content");
    const themeInput = document.getElementById("theme");
    const docTitle = document.getElementById("doc-title");
    const previewSheet = document.querySelector(".preview-sheet");
    const zoomButtons = document.querySelectorAll(".zoom-controls button");
    
    const validateBtn = document.getElementById("validatePlan");
    const nextBtn = document.getElementById("nextStep");
    const pdfBtn = document.getElementById("downloadPdf");

    // 1. Mise à jour de l'aperçu dynamique
    function updatePreview() {
        preview.innerHTML = "<h3>PLAN</h3>";
        const lines = editor.value.split("\n");

        lines.forEach(line => {
            if (line.trim() === "") return;
            const p = document.createElement("p");
            p.textContent = line.trim();

            // Stylisation automatique des lignes
            if (/^[IVX]+\./.test(line)) {
                p.className = "title"; // Style Titre (I, II...)
            } else if (/^[A-Z]\./.test(line.trim())) {
                p.className = "subtitle"; // Style Sous-titre (A, B...)
            } else {
                p.className = "text"; // Style normal
            }
            preview.appendChild(p);
        });
    }

    // 2. Bouton Générer
    generateBtn.addEventListener("click", () => {
        editor.value = "I. Introduction\nII. Développement\n   A. Partie 1\n   B. Partie 2\nIII. Conclusion";
        updatePreview();
    });

    // 3. Écouteurs pour le texte et le titre
    editor.addEventListener("input", updatePreview);
    themeInput.addEventListener("input", () => {
        docTitle.textContent = themeInput.value ? "EXPOSÉ : " + themeInput.value.toUpperCase() : "EXPOSÉ";
    });

    // 4. Gestion du Zoom
    zoomButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const level = btn.getAttribute("data-zoom");
            previewSheet.style.transform = `scale(${level})`;
        });
    });

    // 5. Boutons de navigation (pour vos futures fonctions)
    validateBtn.addEventListener("click", () => {
        alert("Plan enregistré avec succès !");
    });

    nextBtn.addEventListener("click", () => {
        alert("Direction l'étape Introduction (Fonctionnalité 2026 à venir)");
    });

    // 6. Génération PDF
    pdfBtn.addEventListener("click", () => {
        // On remet le zoom à 1 pour un PDF propre
        previewSheet.style.transform = "scale(1)";
        
        const options = {
            margin: 0,
            filename: `Expose_${themeInput.value || 'BuroMaster'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(options).from(document.getElementById("pdf-content")).save();
    });

    // Lancement initial
    updatePreview();
});
