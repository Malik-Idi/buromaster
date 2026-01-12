// Récupération des éléments
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const generateBtn = document.getElementById("generatePlan");
const validateBtn = document.getElementById("validatePlan");
const goIntroBtn = document.getElementById("goIntro");

// PLAN AUTOMATIQUE
generateBtn.addEventListener("click", () => {
    const planAuto = `
I. Introduction

II. Causes de la déforestation
A. Les activités humaines
B. Facteurs économiques et sociaux

III. Conséquences de la déforestation
A. Impact sur la biodiversité
B. Effets sur le climat
C. Conséquences sociales et économiques

IV. Solutions pour lutter contre la déforestation
A. Gestion durable des forêts
B. Politiques et législation
C. Sensibilisation et éducation

V. Conclusion
    `.trim();

    editor.value = planAuto;
    updatePreview();
});

// SYNCHRONISATION EN TEMPS RÉEL
editor.addEventListener("input", updatePreview);

function updatePreview() {
    preview.innerHTML = "";

    const lines = editor.value.split("\n");

    lines.forEach(line => {
        if (line.trim() !== "") {
            const p = document.createElement("p");
            p.textContent = line;
            preview.appendChild(p);
        }
    });
}

// VALIDATION DU PLAN
validateBtn.addEventListener("click", () => {
    if (editor.value.trim() === "") {
        alert("Veuillez d'abord créer ou saisir un plan.");
        return;
    }

    alert("Plan validé ✔️ Vous pouvez passer à l'introduction.");
    goIntroBtn.disabled = false;
});

// BOUTON INTRO (placeholder)
goIntroBtn.addEventListener("click", () => {
    alert("Étape suivante : page Introduction (à venir)");
});
