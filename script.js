document.addEventListener("DOMContentLoaded", () => {

    const editorPlan = document.getElementById("editorPlan");
    const previewPlan = document.getElementById("previewPlan");

    const themeInput = document.getElementById("theme");

    const generatePlanBtn = document.getElementById("generatePlan");
    const validatePlanBtn = document.getElementById("validatePlan");

    function updatePlanPreview() {
        previewPlan.innerHTML = ""; // vide l'aperçu

        const lines = editorPlan.value.split("\n");
        lines.forEach(line => {
            if (line.trim() === "") return;

            const p = document.createElement("p");
            p.textContent = line.trim();
            previewPlan.appendChild(p);
        });
    }

    generatePlanBtn.addEventListener("click", () => {
        editorPlan.value =
`I. Introduction
II. Causes du sujet
   A. Première cause
   B. Deuxième cause
III. Conséquences
   A. Première conséquence
   B. Deuxième conséquence
IV. Solutions
V. Conclusion`;

        updatePlanPreview();
    });

    editorPlan.addEventListener("input", updatePlanPreview);

    validatePlanBtn.addEventListener("click", () => {
        if (editorPlan.value.trim() === "") {
            alert("Le plan est vide. Écris ou génère un plan avant de valider.");
            return;
        }
        alert("🍀 Plan validé ! Tu peux maintenant passer à l’introduction.");

        // Ici plus tard : redirection vers introduction.html ou activation de la suite
    });

});
