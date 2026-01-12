document.addEventListener("DOMContentLoaded", function () {

    const generateBtn = document.getElementById("generatePlan");
    const editor = document.getElementById("editor");

    if (!generateBtn || !editor) {
        return;
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
    });

});
