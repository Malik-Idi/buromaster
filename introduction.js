document.addEventListener("DOMContentLoaded", () => {

    const editorIntro = document.getElementById("editorIntro");
    const previewIntro = document.getElementById("previewIntro");

    const themeInput = document.getElementById("theme");
    const docTitle = document.getElementById("doc-title");

    const generateIntroBtn = document.getElementById("generateIntro");
    const validateIntroBtn = document.getElementById("validateIntro");

    function updateIntroPreview() {
        previewIntro.innerHTML = "";

        const paragraphs = editorIntro.value.split("\n");

        paragraphs.forEach(text => {
            if (text.trim() === "") return;
            const p = document.createElement("p");
            p.textContent = text.trim();
            previewIntro.appendChild(p);
        });
    }

    generateIntroBtn.addEventListener("click", () => {
        editorIntro.value =
`L’introduction permet de présenter le sujet de l’exposé et d’en expliquer l’importance.
Ce thème est essentiel à comprendre car il concerne directement notre quotidien.
Dans cet exposé, nous allons d’abord expliquer les causes, puis les conséquences, avant de proposer des solutions.`;

        updateIntroPreview();
    });

    editorIntro.addEventListener("input", updateIntroPreview);

    themeInput.addEventListener("input", () => {
        if (themeInput.value.trim() !== "") {
            docTitle.textContent = "INTRODUCTION – " + themeInput.value.toUpperCase();
        } else {
            docTitle.textContent = "INTRODUCTION";
        }
    });

    validateIntroBtn.addEventListener("click", () => {
        if (editorIntro.value.trim() === "") {
            alert("L’introduction est vide.");
            return;
        }
        alert("✅ Introduction validée. Tu pourras passer au développement.");
    });

});
