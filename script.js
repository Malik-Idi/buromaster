document.addEventListener("DOMContentLoaded", function () {

    const generateBtn = document.getElementById("generatePlan");
    const editor = document.getElementById("editor");
    const preview = document.getElementById("preview");

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

/* PAGE WORD A4 */
.preview-sheet {
    position: relative;
    width: 210mm;
    min-height: 297mm;
    margin: auto;
    padding: 25mm 20mm;
    background: white;
    font-family: "Times New Roman", serif;
}

/* EN-TÊTE */
.page-header {
    border: 2px solid #0aa64b;
    padding: 12px;
    text-align: center;
    margin-bottom: 25px;
    background: #f3fff7;
}

#doc-title {
    font-size: 20px;
    font-weight: bold;
    text-transform: uppercase;
}

/* CONTENU */
#preview-content p {
    margin: 6px 0;
}

/* PIED DE PAGE */
.page-footer {
    position: absolute;
    bottom: 15mm;
    right: 20mm;
    font-size: 12px;
    color: #555;
}

const themeInput = document.getElementById("theme");
const docTitle = document.getElementById("doc-title");

themeInput.addEventListener("input", () => {
    if (themeInput.value.trim() !== "") {
        docTitle.textContent = "EXPOSÉ : " + themeInput.value;
    } else {
        docTitle.textContent = "EXPOSÉ";
    }
});
