document.addEventListener("DOMContentLoaded", () => {

    const editor = document.getElementById("editor");
    const preview = document.getElementById("preview-content");
    const generateBtn = document.getElementById("generatePlan");
    const themeInput = document.getElementById("theme");
    const docTitle = document.getElementById("doc-title");
    const zoomButtons = document.querySelectorAll(".zoom-controls button");
    const previewSheet = document.querySelector(".preview-sheet");
    const validateBtn = document.querySelector(".validate-btn");
    const nextBtn = document.querySelector(".next-btn");

nextBtn.disabled = true;

    function updatePreview() {
        preview.innerHTML = '<p class="plan-title">PLAN</p>';

        const lines = editor.value.split("\n");

        lines.forEach(line => {
            if (!line.trim()) return;

            const p = document.createElement("p");
            p.textContent = line.trim();

            if (/^[IVX]+\./.test(line)) {
                p.className = "title";
            } else if (/^[A-Z]\./.test(line.trim())) {
                p.className = "subtitle";
            } else {
                p.className = "text";
            }

            preview.appendChild(p);
        });
    }

    generateBtn.addEventListener("click", () => {
        editor.value =
`I. Introduction
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

    editor.addEventListener("input", updatePreview);

    themeInput.addEventListener("input", () => {
        docTitle.textContent = themeInput.value
            ? "EXPOSÉ : " + themeInput.value
            : "EXPOSÉ";
    });

    zoomButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            previewSheet.style.transform = `scale(${btn.dataset.zoom})`;
        });
    });

});
validateBtn.addEventListener("click", () => {
    if (!editor.value.trim()) {
        alert("Veuillez d'abord générer ou écrire un plan.");
        return;
    }

    editor.disabled = true;
    nextBtn.disabled = false;

    alert("Plan validé ✔️\nVous pouvez maintenant passer à l’introduction.");
});
