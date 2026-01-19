// ======================================================================
// PORTION 6/6 : EXPORT PDF ET INITIALISATION FINALE DU SCRIPT
// ======================================================================

    // --- 18. FONCTION D'EXPORTATION PDF ---
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const element = document.getElementById("preview-pages");
            if (!element || !element.innerHTML.trim()) { alert("L'exposé est vide."); return; }

            // ... (Logique pour retirer les transformations CSS avant export) ...

            const options = {
                margin: 0, filename: `Expose_${themeInput.value || "Mon_Projet"}.pdf`,
                image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: ["css", "after"], after: ".preview-sheet" }
            };

            // Utilisation de la librairie html2pdf
            html2pdf().set(options).from(element).save().then(() => {
                // ... (Restauration de l'affichage après export) ...
            });
        });
    }

    // --- 19. INITIALISATION AU DÉMARRAGE DU NAVIGATEUR (Le point de départ réel) ---
    
    // 1. On tente de charger une sauvegarde
    loadData();

    // 2. Si loadData n'a pas trouvé de sauvegarde, on initialise l'interface
    if (reachedStepIndex === 0 && !themeInput.value) {
        goToStep("plan"); 
    } else {
        // Sinon, on s'assure que tout l'affichage est à jour avec les données chargées
        updateHeaderUI();
        updatePreview();
    }

}); // <<< FINALE : Fermeture de document.addEventListener("DOMContentLoaded", ...)
