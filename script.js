document.addEventListener("DOMContentLoaded", function () {
    // Éléments HTML
    const editor = document.getElementById("editor");
    const themeInput = document.getElementById("theme");
    const pagesContainer = document.getElementById("preview-pages");
    const stepTitle = document.getElementById("step-title");
    const generateBtn = document.getElementById("generateBtn");
    const validateBtn = document.getElementById("validateBtn");
    const nextStepBtn = document.getElementById("nextStepBtn");

    // Données de l'exposé (Mémoire du site)
    let currentStep = "plan"; // État actuel : 'plan' ou 'intro'
    let content = { plan: "", intro: "" };
    let isLocked = { plan: false, intro: false };

    // --- 1. FONCTION DE RENDU (L'aperçu A4) ---
    function updatePreview() {
        pagesContainer.innerHTML = ""; // On vide l'aperçu pour reconstruire
        let pageNum = 1;
        let currentPage = createNewPage(pageNum);

        // Rendu du PLAN
        renderText(content.plan, currentPage, () => {
            pageNum++;
            currentPage = createNewPage(pageNum);
            return currentPage;
        });

        // SAUT DE PAGE FORCÉ ET RENDU DE L'INTRODUCTION
        // On affiche l'intro si elle contient du texte OU si on est en train de l'écrire
        if (content.intro.trim() !== "" || currentStep === "intro") {
            pageNum++;
            currentPage = createNewPage(pageNum);
            
            // Titre de section sur la nouvelle page
            const sectionTitle = document.createElement("div");
            sectionTitle.className = "title-style";
            sectionTitle.textContent = "INTRODUCTION";
            currentPage.appendChild(sectionTitle);

            renderText(content.intro, currentPage, () => {
                pageNum++;
                currentPage = createNewPage(pageNum);
                return currentPage;
            });
        }
    }

    function createNewPage(num) {
        const page = document.createElement("div");
        page.className = "preview-sheet";
        page.innerHTML = `
            <div class="page-header">EXPOSÉ : ${themeInput.value.toUpperCase() || "MON EXPOSÉ"}</div>
            <div class="page-content"></div>
            <div class="page-footer">Page ${num}</div>
        `;
        pagesContainer.appendChild(page);
        return page.querySelector(".page-content");
    }

    function renderText(text, pageElement, onPageBreak) {
        if (!text) return;
        const lines = text.split("\n");
        lines.forEach(line => {
            const div = document.createElement("div");
            div.textContent = line.trim() === "" ? "\u00A0" : line;
            
            // Styles auto (I. ou A.)
            if (/^[IVX]+\./.test(line.trim())) div.className = "title-style";
            else if (/^[A-Z]\./.test(line.trim())) div.className = "subtitle-style";
            else div.className = "text-style";
            
            pageElement.appendChild(div);

            // Gestion du débordement de page
            if (pageElement.scrollHeight > 880) {
                pageElement.removeChild(div);
                pageElement = onPageBreak();
                pageElement.appendChild(div);
            }
        });
    }

    // --- 2. GESTION DU VERROUILLAGE (La correction demandée) ---
    function applyLockState() {
        const locked = isLocked[currentStep];
        
        // Verrouiller l'éditeur
        editor.readOnly = locked;
        
        // BLOQUAGE DU BOUTON GÉNÉRER (Sécurité ajoutée)
        generateBtn.disabled = locked;
        generateBtn.style.opacity = locked ? "0.5" : "1";
        generateBtn.style.cursor = locked ? "not-allowed" : "pointer";
        
        // Bouton Valider / Modifier
        validateBtn.textContent = locked ? `Modifier l'étape` : `Valider cette étape`;
        validateBtn.style.background = locked ? "#ff9800" : "#4CAF50";
        
        // Bouton Suivant (uniquement visible si le plan est validé)
        nextStepBtn.style.display = (locked && currentStep === "plan") ? "block" : "none";
        
        // Débloquer l'onglet du haut
        if (isLocked.plan) {
            const linkIntro = document.getElementById("link-intro");
            linkIntro.classList.add("unlocked");
            linkIntro.style.cursor = "pointer";
        }
    }

    // --- 3. NAVIGATION ET ACTIONS ---

    // Écriture
    editor.addEventListener("input", () => {
        content[currentStep] = editor.value;
        updatePreview();
    });

    // Thème
    themeInput.addEventListener("input", updatePreview);

    // Valider
    validateBtn.addEventListener("click", () => {
        isLocked[currentStep] = !isLocked[currentStep];
        applyLockState();
    });

    // Bouton Suivant
    nextStepBtn.addEventListener("click", () => {
        goToStep("intro");
    });

    // Générer modèle
    generateBtn.addEventListener("click", () => {
        if (currentStep === "plan") {
            editor.value = "I. INTRODUCTION\nA. Accroche\nB. Problématique\nII. DÉVELOPPEMENT\nA. Premier axe\nIII. CONCLUSION";
        } else {
            editor.value = "L'exposé que nous présentons aujourd'hui porte sur " + (themeInput.value || "notre sujet") + ". Dans un premier temps...";
        }
        content[currentStep] = editor.value;
        updatePreview();
    });

    // Navigation via les liens du haut
    document.getElementById("link-plan").addEventListener("click", () => goToStep("plan"));
    document.getElementById("link-intro").addEventListener("click", () => {
        if (isLocked.plan) goToStep("intro");
    });

    function goToStep(step) {
        // Sauvegarde de l'étape actuelle avant de changer
        content[currentStep] = editor.value;
        
        currentStep = step;
        
        // Mise à jour visuelle
        stepTitle.textContent = step === "plan" ? "Édition du Plan" : "Rédaction de l'Introduction";
        generateBtn.textContent = step === "plan" ? "Générer un plan" : "Générer une introduction";
        editor.value = content[step];
        
        // Onglets actifs
        document.querySelectorAll(".step-link").forEach(l => l.classList.remove("active"));
        document.getElementById(`link-${step}`).classList.add("active");
        
        applyLockState();
        updatePreview();
    }

    // Export PDF
    document.getElementById("downloadPdf").addEventListener("click", () => {
        const opt = {
            margin: 0,
            filename: 'mon-expose-2026.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(pagesContainer).save();
    });

    // Initialisation
    updatePreview();
});
