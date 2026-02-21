/**
 * BUROMASTER - PaginationEngine
 * Production ULTIMATE Edition
 * Architecture robuste – Interopérable – Sécurisée
 */

(() => {
    "use strict";

    const PaginationEngine = {

        /* ==============================
           ÉTAT INTERNE ULTRA SÉCURISÉ
        ============================== */

        _state: {
            isPaginating: false,
            observer: null,
            initialized: false
        },

        config: Object.freeze({
            pageSelector: '.a4-page',
            contentSelector: '.page-content',
            footerSelector: '.page-footer',
            containerId: 'main-container',
            maxLoopSecurity: 40
        }),

        /* ==============================
           INITIALISATION ROBUSTE
        ============================== */

        init() {
            if (this._state.initialized) return;

            const container = document.getElementById(this.config.containerId);
            if (!container) return;

            this._bindEvents(container);
            this._initObserver(container);
            this.renumeroterPages();

            this._state.initialized = true;
        },

        /* ==============================
           LIAISONS INFALLIBLES
        ============================== */

        _bindEvents(container) {

            container.addEventListener('input', (e) => {
                this.ajusterLeFlux(e);
            }, { passive: true });

            container.addEventListener('keydown', (e) => {
                if (e.key === "Backspace" || e.key === "Delete") {
                    requestAnimationFrame(() => this.ajusterLeFlux());
                }
            });

            window.addEventListener('resize', () => {
                this._debounce(() => this.ajusterLeFlux(), 100);
            });
        },

        _initObserver(container) {

            if (!window.MutationObserver) return;

            this._state.observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === "childList") {
                        this.notifierChangement();
                        break;
                    }
                }
            });

            this._state.observer.observe(container, {
                childList: true,
                subtree: true
            });
        },

        /* ==============================
           CRÉATION PAGE BLINDÉE
        ============================== */

        creerNouvellePage() {

            const container = document.getElementById(this.config.containerId);
            if (!container) return null;

            const page = document.createElement('div');
            page.className = 'a4-page';

            const content = document.createElement('div');
            content.className = 'page-content';
            content.contentEditable = "true";
            content.setAttribute('spellcheck', 'true');

            const footer = document.createElement('div');
            footer.className = 'page-footer';
            footer.contentEditable = "false";

            page.appendChild(content);
            page.appendChild(footer);
            container.appendChild(page);

            this.renumeroterPages();

            this._dispatchEvent('buromaster:page-created', { page });

            return content;
        },

        /* ==============================
           RENOMINATION SÉCURISÉE
        ============================== */

        renumeroterPages() {

            const pages = document.querySelectorAll(this.config.pageSelector);

            pages.forEach((page, index) => {
                const footer = page.querySelector(this.config.footerSelector);
                if (footer) {
                    footer.textContent = `BuroMaster | Page ${index + 1}`;
                }
            });

            this.notifierChangement();
        },

        /* ==============================
           MOTEUR PHYSIQUE ULTIMATE
        ============================== */

        ajusterLeFlux(event = null) {

            if (this._state.isPaginating) return;
            this._state.isPaginating = true;

            try {

                const activeZone = this._getActiveZone(event);
                if (!activeZone) return;

                this._handleForwardOverflow(activeZone);
                this._handleBackwardPull(activeZone);

            } catch (err) {
                console.error("PaginationEngine error:", err);
            } finally {
                this._state.isPaginating = false;
            }
        },

        _getActiveZone(event) {
            if (event && event.target) {
                return event.target.closest(this.config.contentSelector);
            }
            return document.querySelector(this.config.contentSelector);
        },

        _handleForwardOverflow(zone) {

            let safety = 0;

            while (zone.scrollHeight > zone.clientHeight && safety < this.config.maxLoopSecurity) {

                const lastElement = zone.lastElementChild;
                if (!lastElement) break;

                const currentPage = zone.closest(this.config.pageSelector);
                if (!currentPage) break;

                let nextPage = currentPage.nextElementSibling;
                let nextZone = nextPage
                    ? nextPage.querySelector(this.config.contentSelector)
                    : this.creerNouvellePage();

                if (!nextZone) break;

                nextZone.prepend(lastElement);
                safety++;
            }
        },

        _handleBackwardPull(zone) {

            const currentPage = zone.closest(this.config.pageSelector);
            if (!currentPage) return;

            const nextPage = currentPage.nextElementSibling;
            if (!nextPage) return;

            const nextZone = nextPage.querySelector(this.config.contentSelector);
            if (!nextZone) return;

            let safety = 0;

            while (nextZone.firstElementChild && safety < this.config.maxLoopSecurity) {

                const firstNext = nextZone.firstElementChild;
                zone.appendChild(firstNext);

                if (zone.scrollHeight > zone.clientHeight) {
                    nextZone.prepend(firstNext);
                    break;
                }

                safety++;
            }

            if (nextZone.innerHTML.trim() === "") {
                nextPage.remove();
                this.renumeroterPages();
                this._dispatchEvent('buromaster:page-removed');
            }
        },

        /* ==============================
           COMMUNICATION INTER-MODULE
        ============================== */

        notifierChangement() {
            this._dispatchEvent('buromaster:dom-changed');
        },

        _dispatchEvent(name, detail = {}) {
            document.dispatchEvent(new CustomEvent(name, { detail }));
        },

        /* ==============================
           UTILITAIRE INTERNE
        ============================== */

        _debounce(fn, delay) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(fn, delay);
        }
    };

    /* ==============================
       EXPORT PRODUCTION SAFE
    ============================== */

    Object.defineProperty(window, 'PaginationEngine', {
        value: PaginationEngine,
        writable: false,
        configurable: false
    });

    Object.defineProperty(window, 'creerNouvellePage', {
        value: () => PaginationEngine.creerNouvellePage(),
        writable: false,
        configurable: false
    });

    Object.defineProperty(window, 'ajusterLeFlux', {
        value: (e) => PaginationEngine.ajusterLeFlux(e),
        writable: false,
        configurable: false
    });

    document.addEventListener('DOMContentLoaded', () => {
        PaginationEngine.init();
    });

})();
