/**
 * @file storage.js
 * @description Moteur de persistance Production SaaS – Version Hardened
 * @version 8.0 (Market Secure Edition)
 */

const StorageEngine = (() => {
    'use strict';

    const DB_KEY = 'BM_PRO_PERSISTENCE';
    const SCHEMA_VERSION = '2.0';
    const MAX_SAFE_SIZE = 4.5 * 1024 * 1024; // 4.5MB sécurité

    /* ===============================
       MODÈLE SOURCE
    =============================== */

    const INITIAL_MODEL = Object.freeze({
        version: SCHEMA_VERSION,
        metadata: {
            theme: '',
            studentClass: '',
            lastModified: null
        },
        document: {
            pages: [],
            config: {
                fontFamily: 'poppins',
                fontSize: 12,
                headerStyle: 'none',
                footerStyle: 'none',
                customHeaderHTML: '',
                customFooterHTML: ''
            }
        }
    });

    const deepClone = (obj) =>
        JSON.parse(JSON.stringify(obj));

    const getFreshModel = () =>
        deepClone(INITIAL_MODEL);

    /* ===============================
       VALIDATION PROFONDE
    =============================== */

    const validate = (data) => {
        if (!data || typeof data !== 'object') return false;
        if (data.version !== SCHEMA_VERSION) return false;
        if (!data.metadata || !data.document) return false;
        if (!Array.isArray(data.document.pages)) return false;

        const cfg = data.document.config;
        if (!cfg || typeof cfg !== 'object') return false;

        if (typeof cfg.fontFamily !== 'string') return false;
        if (typeof cfg.fontSize !== 'number') return false;
        if (typeof cfg.headerStyle !== 'string') return false;
        if (typeof cfg.footerStyle !== 'string') return false;

        return true;
    };

    /* ===============================
       MIGRATION SCHÉMA
    =============================== */

    const migrate = (data) => {
        if (!data.version) return getFreshModel();

        // Exemple migration future
        if (data.version === '1.0') {
            data.version = '2.0';
            data.document.config.footerStyle = 'none';
            data.document.config.customHeaderHTML = '';
            data.document.config.customFooterHTML = '';
        }

        return data;
    };

    /* ===============================
       ÉVÉNEMENTS
    =============================== */

    const emitUpdate = (status, extra = {}) => {
        window.dispatchEvent(
            new CustomEvent('bm:storage-update', {
                detail: {
                    status,
                    timestamp: new Date().toISOString(),
                    ...extra
                }
            })
        );
    };

    /* ===============================
       API PUBLIQUE
    =============================== */

    return {

        save(payload) {
            try {
                const safePayload = deepClone(payload);

                if (!validate(safePayload)) {
                    throw new Error("Invalid schema");
                }

                safePayload.metadata.lastModified =
                    new Date().toISOString();

                const serialized = JSON.stringify(safePayload);

                if (serialized.length > MAX_SAFE_SIZE) {
                    throw new Error("Storage quota risk detected");
                }

                localStorage.setItem(DB_KEY, serialized);

                emitUpdate('success');
                return true;

            } catch (error) {

                if (error.name === 'QuotaExceededError') {
                    console.error("StorageEngine: Quota exceeded.");
                    emitUpdate('quota-exceeded');
                } else {
                    console.error("StorageEngine [Save Failure]:", error);
                    emitUpdate('error');
                }

                return false;
            }
        },

        load() {
            try {
                const raw = localStorage.getItem(DB_KEY);
                if (!raw) return getFreshModel();

                let parsed = JSON.parse(raw);

                parsed = migrate(parsed);

                if (!validate(parsed)) {
                    console.warn("StorageEngine: Corrupted data reset.");
                    return getFreshModel();
                }

                return parsed;

            } catch (error) {
                console.error("StorageEngine [Load Failure]:", error);
                return getFreshModel();
            }
        },

        clear() {
            localStorage.removeItem(DB_KEY);
            emitUpdate('cleared');
        },

        exportRaw() {
            return localStorage.getItem(DB_KEY);
        },

        importRaw(rawString) {
            try {
                const parsed = JSON.parse(rawString);
                const migrated = migrate(parsed);

                if (!validate(migrated)) {
                    throw new Error("Invalid import data");
                }

                localStorage.setItem(DB_KEY, JSON.stringify(migrated));
                emitUpdate('imported');
                return true;

            } catch (error) {
                console.error("StorageEngine: Import failed.", error);
                emitUpdate('import-error');
                return false;
            }
        }

    };

})();

Object.freeze(StorageEngine);
