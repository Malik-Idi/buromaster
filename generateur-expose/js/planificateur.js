/**
 * MODULE : Planificateur
 * Rôle : Gestion de la structure de l'exposé (Sommaire).
 * Liaison : Enregistre les sections dans StorageEngine pour l'Editeur.
 */
const Planificateur = {
    
    /** Initialise l'interface du planificateur dans le DOM */
    render() {
        const container = document.getElementById('main-view');
        const data = StorageEngine.load();
        
        container.innerHTML = `
            <div class="module-header">
                <h2>Étape 1 : Structurez votre exposé</h2>
                <p>Ajoutez les grandes parties de votre travail (ex: Introduction, Développement, Conclusion).</p>
            </div>
            
            <div class="plan-input-group">
                <input type="text" id="section-title-input" placeholder="Titre de la section (ex: I. Les causes du réchauffement)" />
                <button onclick="Planificateur.addSection()" class="btn-primary">Ajouter cette partie</button>
            </div>

            <ul id="plan-list" class="sortable-list">
                <!-- Les sections s'afficheront ici -->
            </ul>

            <div class="actions-bar">
                <button onclick="App.router('step-edit')" class="btn-next">Passer à la rédaction →</button>
            </div>
        `;

        this.refreshList();
    },

    /** Ajoute une section au schéma de données */
    addSection() {
        const input = document.getElementById('section-title-input');
        const title = input.value.trim();

        if (title === "") {
            alert("Le titre de la section ne peut pas être vide.");
            return;
        }

        const data = StorageEngine.load();
        const newSection = {
            id: 'sec_' + Date.now(),
            title: title
        };

        data.plan.push(newSection);
        StorageEngine.save(data);
        
        input.value = ""; // Reset
        this.refreshList();
        App.updateUIStatus();
    },

    /** Supprime une section */
    deleteSection(id) {
        const data = StorageEngine.load();
        data.plan = data.plan.filter(sec => sec.id !== id);
        StorageEngine.save(data);
        this.refreshList();
        App.updateUIStatus();
    },

    /** Rafraîchit visuellement la liste des sections */
    refreshList() {
        const list = document.getElementById('plan-list');
        const data = StorageEngine.load();

        if (data.plan.length === 0) {
            list.innerHTML = '<li class="empty-msg">Aucune section définie pour le moment.</li>';
            return;
        }

        list.innerHTML = data.plan.map((sec, index) => `
            <li class="plan-item">
                <span class="index">${index + 1}</span>
                <span class="title">${sec.title}</span>
                <button onclick="Planificateur.deleteSection('${sec.id}')" class="btn-delete">×</button>
            </li>
        `).join('');
    }
};
