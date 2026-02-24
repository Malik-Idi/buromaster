/**
 * MODULE : Storage Engine
 * Rôle : Gestion persistante des données sur localStorage avec blindage contre les erreurs.
 */
const StorageEngine = {
    DB_NAME: 'EDUWRITE_PRO_DATA',

    // Structure de données initiale (le schéma de l'exposé)
    schema: {
        metadata: { title: '', date: '', author: '' },
        plan: [],
        content: {}, // Stocke le texte par ID de section
        visuals: []
    },

    /** Sauvegarde les données avec validation */
    save(data) {
        try {
            const payload = JSON.stringify(data);
            localStorage.setItem(this.DB_NAME, payload);
            console.log("Storage: Sauvegarde réussie.");
            return true;
        } catch (e) {
            console.error("Storage Error: Capacité locale dépassée ou accès refusé.", e);
            return false;
        }
    },

    /** Récupère les données ou initialise le schéma */
    load() {
        const data = localStorage.getItem(this.DB_NAME);
        if (!data) {
            this.save(this.schema);
            return this.schema;
        }
        return JSON.parse(data);
    },

    /** Mise à jour partielle (ex: juste le titre) */
    update(key, value) {
        const current = this.load();
        current[key] = value;
        return this.save(current);
    }
};
