/**
 * BUROMASTER - UI (L'Interface)
 * Gère les éléments du DOM, les événements et l'affichage.
 */

document.addEventListener("DOMContentLoaded", function () {
    // --- 1. SÉLECTION DES ÉLÉMENTS ---
    const getEl = (id) => document.getElementById(id);

    const ui = {
        editor: getEl("editor"),
        theme: getEl("theme"),
        studentClass: getEl("studentClass"),
        pagesContainer: getEl("preview-pages"),
        stepTitle: getEl("step-title"),
        validateBtn: getEl("validateBtn"),
        nextStepBtn: getEl("nextStepBtn"),
        generateBtn: getEl("generateBtn"),
        downloadBtn: getEl("downloadPdf"),
        autoFormatCheckbox: getEl("autoFormatCheckbox"),
        resetAllBtn: getEl("resetAllBtn"),
        fontSelect: getEl("fontSelect"),
        fontSizeInput: getEl("fontSizeInput"),
        aiDetailLevel: getEl("aiDetailLevel"),
        zoomInBtn: getEl("zoomInBtn"),
        zoomOutBtn: getEl("zoomOutBtn"),
        zoomLevelSpan: getEl("zoomLevel"),
        undoBtn: getEl("undoBtn"),
        redoBtn: getEl("redoBtn"),
        devBlocksContainer: getEl("dev-blocks-container")
    };

    // --- 7. NAVIGATION ---
    window.goToStep = function(step) {
        if (!stepsOrder.includes(step)) return;
        if (currentStep !== "dev" && ui.editor) content[currentStep] = ui.editor.value;
        currentStep = step;

        const stepNames = { plan: "Sommaire", intro: "Introduction", dev: "Développement", conclu: "Conclusion" };
        if (ui.stepTitle) ui.stepTitle.textContent = `Édition : ${stepNames[step]}`;
        
        const locked = isLocked[step];

        if (ui.validateBtn) {
            ui.validateBtn.textContent = locked ? "Modifier cette étape" : "Valider cette étape";
            ui.validateBtn.style.backgroundColor = locked ? "#f59e0b" : "#10b981";
        }

        if (ui.nextStepBtn) {
            const currentIndex = stepsOrder.indexOf(step);
            if (step === "conclu" && locked) {
                ui.nextStepBtn.textContent = "Exporter en Word (.doc)";
                ui.nextStepBtn.style.display = "block";
                ui.nextStepBtn.onclick = () => exportToWord();
            } else if (locked && currentIndex < stepsOrder.length - 1) {
                ui.nextStepBtn.textContent = "Étape Suivante";
                ui.nextStepBtn.style.display = "block";
                ui.nextStepBtn.onclick = () => goToStep(stepsOrder[currentIndex + 1]);
            } else {
                ui.nextStepBtn.style.display = "none";
            }
        }

        if (ui.generateBtn) ui.generateBtn.style.display = (!locked && step !== "dev") ? "block" : "none";
        if (ui.devBlocksContainer) ui.devBlocksContainer.style.display = (step === "dev") ? "block" : "none";
        if (ui.editor) ui.editor.style.display = (step === "dev") ? "none" : "block";

        refreshUIFromData();
        saveData();
    };

    // --- 8. RENDU ---
    window.updatePreview = function() {
        if (!ui.pagesContainer) return;
        ui.pagesContainer.innerHTML = "";
        let pageNum = 1;

        let currentFullPage = createNewPage(pageNum, ui.pagesContainer);
        const locked = isLocked[currentStep];

        currentFullPage.content.contentEditable = !locked;

        if (currentStep !== "dev") {
            const titles = { plan: "SOMMAIRE", intro: "INTRODUCTION", conclu: "CONCLUSION" };
            renderTextToPages(
                titles[currentStep], 
                content[currentStep], 
                currentFullPage, 
                (nextNum) => createNewPage(nextNum, ui.pagesContainer),
                ui.fontSelect.value,
                ui.fontSizeInput.value
            );
        } else {
            renderDevOnA4(ui.pagesContainer, pageNum, locked);
        }
        updateZoomUI();
    };

    // --- 10. CRÉATION DE PAGE ---
    window.createNewPage = function(num, container) {
        const wrapper = document.createElement("div");
        wrapper.className = "page-wrapper";
        wrapper.innerHTML = `
            <div class="preview-sheet">
                <div class="page-content"></div>
                <div class="page-footer">BuroMaster | Page ${num}</div>
            </div>`;

        const contentArea = wrapper.querySelector(".page-content");
        contentArea.addEventListener("input", () => {
            if (currentStep === "dev" || isLocked[currentStep]) return;
            content[currentStep] = contentArea.innerText;
            clearTimeout(editorPreviewTimer);
            editorPreviewTimer = setTimeout(() => {
                if (contentArea.scrollHeight > 940) updatePreview();
                saveData();
            }, 1000);
        });

        container.appendChild(wrapper);
        return { wrapper, content: contentArea };
    };

    // --- 13. RENDU DÉVELOPPEMENT ---
    window.renderDevOnA4 = function(container, startPageNum, locked) {
        let currentPageNum = startPageNum;
        let currentFullPage = createNewPage(currentPageNum, container);
        const font = ui.fontSelect.value;
        const size = ui.fontSizeInput.value + "px";

        const sections = parsePlanForDev(content.plan || "");
        sections.forEach((section) => {
            const h2 = document.createElement("h2");
            h2.className = "a4-section-title";
            h2.style.fontFamily = font;
            h2.textContent = section.fullTitle;
            currentFullPage.content.appendChild(h2);

            const textContent = content.dev[section.fullTitle] || "";
            if (textContent) {
                const paragraphs = textContent.split("\n");
                paragraphs.forEach(para => {
                    const p = document.createElement("p");
                    p.style.fontFamily = font;
                    p.style.fontSize = size;
                    currentFullPage.content.appendChild(p);

                    para.split(" ").forEach(word => {
                        const oldText = p.textContent;
                        p.textContent += (p.textContent ? " " : "") + word;
                        if (currentFullPage.content.scrollHeight > 930) {
                            p.textContent = oldText;
                            currentPageNum++;
                            currentFullPage = createNewPage(currentPageNum, container);
                            const newP = document.createElement("p");
                            newP.style.fontFamily = font;
                            newP.style.fontSize = size;
                            newP.textContent = word;
                            currentFullPage.content.appendChild(newP);
                        }
                    });
                });
            }
        });
    };

    // --- 17. ZOOM & NOTIFS ---
    window.updateZoomUI = function() {
        const sheets = document.querySelectorAll(".preview-sheet");
        sheets.forEach(sheet => {
            sheet.style.transform = `scale(${currentZoom})`;
            sheet.parentElement.style.height = (1123 * currentZoom) + "px";
        });
        if (ui.zoomLevelSpan) ui.zoomLevelSpan.textContent = `${Math.round(currentZoom * 100)}%`;
    };

    window.showNotification = function(msg) {
        const toast = document.createElement("div");
        toast.className = "toast-notification";
        toast.innerHTML = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    };

    // --- ÉVÉNEMENTS BOUTONS ---
    if (ui.undoBtn) ui.undoBtn.onclick = () => undo();
    if (ui.redoBtn) ui.redoBtn.onclick = () => redo();
    if (ui.zoomInBtn) ui.zoomInBtn.onclick = () => { if (currentZoom < 1.5) { currentZoom += 0.1; updateZoomUI(); } };
    if (ui.zoomOutBtn) ui.zoomOutBtn.onclick = () => { if (currentZoom > 0.3) { currentZoom -= 0.1; updateZoomUI(); } };

    // --- INITIALISATION FINALE ---
    try {
        const start = loadData();
        goToStep(start);
    } catch (e) { console.error(e); }
});

