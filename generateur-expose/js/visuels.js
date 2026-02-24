/**
 * MODULE : Visuels
 * Rôle : Création et gestion des éléments graphiques (Tableaux, légendes).
 * Liaison : Stocke les objets visuels dans StorageEngine.visuals.
 */
const Visuels = {

    /** Affiche l'interface de gestion des visuels */
    render() {
        const container = document.getElementById('main-view');
        const data = StorageEngine.load();

        container.innerHTML = `
            <div class="module-header">
                <h2>Étape 3 : Illustrations et Tableaux</h2>
                <p>Ajoutez des éléments visuels pour enrichir votre exposé papier.</p>
            </div>

            <div class="visual-selector">
                <button onclick="Visuels.showTableCreator()" class="btn-secondary">+ Ajouter un Tableau</button>
                <button onclick="Visuels.showIllustrationPlaceholder()" class="btn-secondary">+ Prévoir un emplacement Image</button>
            </div>

            <div id="visual-workspace">
                <!-- Zone dynamique pour la création -->
            </div>

            <div id="visual-list-container">
                <h3>Éléments enregistrés</h3>
                <ul id="visual-list" class="visual-grid"></ul>
            </div>

            <div class="actions-bar">
                <button onclick="App.router('step-export')" class="btn-next">Finaliser l'exposé →</button>
            </div>
        `;
        this.refreshVisualList();
    },

    /** Logique de création d'un tableau simplifié */
    showTableCreator() {
        const workspace = document.getElementById('visual-workspace');
        workspace.innerHTML = `
            <div class="creator-card">
                <h4>Nouveau Tableau</h4>
                <input type="text" id="v-title" placeholder="Titre du tableau (ex: Résultats de l'expérience)">
                <textarea id="v-data" placeholder="Entrez vos données séparées par des virgules (ex: Nom, Age, Ville)"></textarea>
                <p class="hint">Astuce : Une ligne par ligne de tableau.</p>
                <button onclick="Visuels.saveVisual('table')" class="btn-save">Enregistrer le tableau</button>
            </div>
        `;
    },

    /** Enregistre le visuel dans le stockage blindé */
    saveVisual(type) {
        const title = document.getElementById('v-title').value.trim();
        const rawData = document.getElementById('v-data').value.trim();

        if (!title || !rawData) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        const data = StorageEngine.load();
        if (!data.visuals) data.visuals = [];

        const newVisual = {
            id: 'vis_' + Date.now(),
            type: type,
            title: title,
            content: rawData,
            createdAt: new Date().toISOString()
        };

        data.visuals.push(newVisual);
        StorageEngine.save(data);
        
        document.getElementById('visual-workspace').innerHTML = ''; // Nettoyage
        this.refreshVisualList();
        App.updateUIStatus();
    },

    /** Rafraîchit la liste des visuels créés */
    refreshVisualList() {
        const list = document.getElementById('visual-list');
        const data = StorageEngine.load();

        if (!data.visuals || data.visuals.length === 0) {
            list.innerHTML = '<p class="empty-msg">Aucun visuel créé.</p>';
            return;
        }

        list.innerHTML = data.visuals.map(v => `
            <li class="visual-item-card">
                <strong>${v.type.toUpperCase()} : ${v.title}</strong>
                <button onclick="Visuels.deleteVisual('${v.id}')" class="btn-delete">Supprimer</button>
            </li>
        `).join('');
    },

    deleteVisual(id) {
        const data = StorageEngine.load();
        data.visuals = data.visuals.filter(v => v.id !== id);
        StorageEngine.save(data);
        this.refreshVisualList();
    }
};
