/**
 * MODULE : Editeur
 * Rôle : Interface de rédaction liée aux sections du plan.
 * Liaison : Lit le plan dans StorageEngine et sauvegarde le contenu textuel.
 */
const Editeur = {

    /** Affiche l'interface de rédaction */
    render() {
        const container = document.getElementById('main-view');
        const data = StorageEngine.load();

        // Blindage : Vérifier si un plan existe avant de rédiger
        if (!data.plan || data.plan.length === 0) {
            container.innerHTML = `
                <div class="error-panel">
                    <h3>Oups ! Votre exposé est vide.</h3>
                    <p>Veuillez d'abord définir vos parties dans l'étape "Structure du plan".</p>
                    <button onclick="App.router('step-plan')" class="btn-primary">Retour au plan</button>
                </div>`;
            return;
        }

        // Génération des zones de texte pour chaque section du plan
        const sectionsHTML = data.plan.map(sec => `
            <div class="editor-section">
                <label for="input-${sec.id}">${sec.title}</label>
                <textarea 
                    id="input-${sec.id}" 
                    placeholder="Rédigez le contenu de cette partie ici..."
                    oninput="Editeur.autoSave('${sec.id}', this.value)"
                >${data.content[sec.id] || ''}</textarea>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="module-header">
                <h2>Étape 2 : Rédaction de l'exposé</h2>
                <p>Le contenu est sauvegardé automatiquement à chaque lettre saisie.</p>
            </div>
            <div class="editor-container">
                ${sectionsHTML}
            </div>
            <div class="actions-bar">
                <button onclick="App.router('step-visuals')" class="btn-next">Ajouter des visuels →</button>
            </div>
        `;
    },

    /** 
     * Sauvegarde en temps réel 
     * @param {string} sectionId - L'ID de la section concernée
     * @param {string} text - Le contenu saisi
     */
    autoSave(sectionId, text) {
        const data = StorageEngine.load();
        
        // Initialisation de l'objet content si inexistant
        if (!data.content) data.content = {};
        
        // Liaison de la donnée
        data.content[sectionId] = text;
        
        // Sauvegarde silencieuse via le moteur de stockage
        StorageEngine.save(data);
        
        // Mise à jour visuelle du statut (feedback utilisateur)
        App.updateUIStatus();
    }
};
