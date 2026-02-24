/**
 * MODULE : Export
 * Rôle : Assemblage final et mise en page A4 pour impression.
 * Liaison : Fusionne Plan, Contenu et Visuels dans un flux HTML imprimable.
 */
const Export = {

    /** Génère l'aperçu avant impression */
    render() {
        const container = document.getElementById('main-view');
        const data = StorageEngine.load();

        // 1. Génération de la Page de Garde
        const coverPage = `
            <div class="print-page cover-page">
                <h1>${data.metadata.title || 'Exposé sans titre'}</h1>
                <p class="author">Présenté par : ${data.metadata.author || 'Élève'}</p>
                <p class="date">Date : ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
        `;

        // 2. Génération du Sommaire
        const tocPage = `
            <div class="print-page toc-page">
                <h2>Sommaire</h2>
                <ul>
                    ${data.plan.map((sec, i) => `<li><span>${i+1}. ${sec.title}</span></li>`).join('')}
                </ul>
            </div>
        `;

        // 3. Génération du Corps de l'exposé (Texte + Visuels)
        const contentPages = data.plan.map(sec => {
            const text = data.content[sec.id] || '<p class="empty">Aucun contenu rédigé pour cette partie.</p>';
            
            // Liaison : Chercher si un visuel est rattaché à ce titre (simplifié par titre ici)
            const visual = (data.visuals || []).find(v => v.title.includes(sec.title)) || null;
            const visualHTML = visual ? this.formatVisual(visual) : '';

            return `
                <div class="print-page body-page">
                    <h2>${sec.title}</h2>
                    <div class="text-content">${text.replace(/\n/g, '<br>')}</div>
                    ${visualHTML}
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="module-header no-print">
                <h2>Étape 4 : Aperçu et Impression</h2>
                <p>Vérifiez votre travail avant de l'imprimer pour le rendre.</p>
                <button onclick="window.print()" class="btn-print">Imprimer l'exposé (PDF/Papier)</button>
            </div>
            <div id="print-preview">
                ${coverPage}
                ${tocPage}
                ${contentPages}
            </div>
        `;
    },

    /** Transforme les données brutes des visuels en HTML propre */
    formatVisual(visual) {
        if (visual.type === 'table') {
            const lines = visual.content.split('\n');
            const rows = lines.map(line => {
                const cells = line.split(',');
                return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`;
            }).join('');
            
            return `
                <div class="visual-container">
                    <table class="print-table">
                        <caption>${visual.title}</caption>
                        ${rows}
                    </table>
                </div>
            `;
        }
        return '';
    }
};
