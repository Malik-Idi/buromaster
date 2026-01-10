document.addEventListener("DOMContentLoaded", () => {

    const editorPlan = document.getElementById("editorPlan");
    const editorIntro = document.getElementById("editorIntro");

    const previewPlan = document.getElementById("previewPlan");
    const previewIntro = document.getElementById("previewIntro");

    const validatePlanBtn = document.getElementById("validatePlan");
    const validateIntroBtn = document.getElementById("validateIntro");

    const planSection = document.getElementById("plan-section");
    const introSection = document.getElementById("intro-section");
    const introPage = document.getElementById("introPage");

    /* -------- PLAN -------- */
    function updatePlanPreview() {
        previewPlan.innerHTML = "";
        editorPlan.value.split("\n").forEach(line => {
            if (line.trim() === "") return;
            const p = document.createElement("p");
            p.textContent = line;
            previewPlan.appendChild(p);
        });
    }

    document.getElementById("generatePlan").onclick = () => {
        editorPlan.value =
`I. Introduction
II. Causes du sujet
III. Conséquences
IV. Solutions
V. Conclusion`;
        updatePlanPreview();
    };

    editorPlan.addEventListener("input", updatePlanPreview);

    validatePlanBtn.onclick = () => {
        if (editorPlan.value.trim() === "") {
            alert("Le plan est vide");
            return;
        }
        introSection.style.display = "block";
        introPage.style.display = "block";
        introSection.scrollIntoView({ behavior: "smooth" });
    };

    /* -------- INTRODUCTION -------- */
    function updateIntroPreview() {
        previewIntro.innerHTML = "";
        editorIntro.value.split("\n").forEach(line => {
            if (line.trim() === "") return;
            const p = document.createElement("p");
            p.textContent = line;
            previewIntro.appendChild(p);
        });
    }

    document.getElementById("generateIntro").onclick = () => {
        editorIntro.value =
"Dans cet exposé, nous allons parler de ce sujet important. Nous verrons ses causes, ses conséquences et les solutions possibles.";
        updateIntroPreview();
    };

    editorIntro.addEventListener("input", updateIntroPreview);

    validateIntroBtn.onclick = () => {
        if (editorIntro.value.trim() === "") {
            alert("Introduction vide");
            return;
        }
        alert("Introduction validée ✅");
    };

});
