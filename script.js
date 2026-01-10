document.addEventListener("DOMContentLoaded", function () {

    const generateBtn = document.getElementById("generatePlan");
    const editor = document.getElementById("editor");
    const preview = document.getElementById("preview-content");

    function updatePreview() {
    preview.innerHTML = "";

    const lines = editor.value.split("\n");

    lines.forEach(line => {
        if (line.trim() === "") return;

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

    generateBtn.addEventListener("click", function () {
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

});
const themeInput = document.getElementById("theme");
const docTitle = document.getElementById("doc-title");

themeInput.addEventListener("input", () => {
    if (themeInput.value.trim() !== "") {
        docTitle.textContent = "EXPOSÉ : " + themeInput.value;
    } else {
        docTitle.textContent = "EXPOSÉ";
    }
});
const previewSheet = document.querySelector(".preview-sheet");
const zoomButtons = document.querySelectorAll(".zoom-controls button");

zoomButtons.forEach(button => {
    button.addEventListener("click", () => {
        const zoom = button.getAttribute("data-zoom");
        previewSheet.style.transform = `scale(${zoom})`;
        previewSheet.style.transformOrigin = "top center";
    });
});
