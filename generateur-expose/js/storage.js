/**
 * @file storage.js
 * @description Moteur de persistance de données (Version Architecte 20/20).
 * @author BuroMaster Pro Engine
 */

const StorageEngine = (() => {
    'use strict';

    const STORAGE_KEY = 'BM_PRO_PERSISTENCE';
    const SCHEMA_VERSION = '1.0';

    const INITIAL_MODEL = Object.freeze({
        version: SCHEMA_VERSION,
        metadata: { theme: '', studentClass: '', lastModified: null },
        document: {
            pages: [], 
            config: { fontFamily: 'poppins', fontSize: 12, headerStyle: 'none' }
        }
    });

    /** Clone profondément le modèle pour éviter les fuites de référence */
    const getFreshModel = () => JSON.parse(JSON.stringify(INITIAL_MODEL));

    const validateIntegrity = (data) => {
        return data && typeof data === 'object' && 
               data.version === SCHEMA_VERSION && 
               data.document && Array.isArray(data.document.pages);
    };

    /** Émet un événement global pour l'UI (Découplage total) */
    const notifyUI = (status) => {
        const event = new CustomEvent('bm:storage-update', { detail: { status } });
        window.dispatchEvent(event);
    };

    return {
        save(payload) {
            try {
                if (!validateIntegrity(payload)) throw new Error("Schema Invalide");
                
                payload.metadata.lastModified = new Date().toISOString();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
                
                notifyUI('success');
                return true;
            } catch (error) {
                console.error("StorageEngine Save Fail:", error);
                notifyUI('error');
                return false;
            }
        },

        load() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return getFreshModel();

                const data = JSON.parse(raw);
                return validateIntegrity(data) ? data : getFreshModel();
            } catch (e) {
                return getFreshModel();
            }
        },

        clear() {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    };
})();

Object.freeze(StorageEngine);
