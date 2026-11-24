'use strict';

(() => {
    const STORAGE_KEY = 'sharee-theme';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';

    function leerTemaGuardado() {
        try {
            const tema = localStorage.getItem(STORAGE_KEY);
            return tema === DARK_THEME || tema === LIGHT_THEME ? tema : null;
        } catch (error) {
            console.warn('No se pudo leer el tema guardado:', error);
            return null;
        }
    }

    function temaInicial() {
        const guardado = leerTemaGuardado();

        if (guardado) {
            return guardado;
        }

        return window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
            ? DARK_THEME
            : LIGHT_THEME;
    }

    function temaActual() {
        return document.documentElement.dataset.theme === DARK_THEME
            ? DARK_THEME
            : LIGHT_THEME;
    }

    function crearIcono(tema) {
        if (tema === DARK_THEME) {
            // Sol: pulsar permite cambiar al tema claro.
            return `
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path>
                </svg>
            `;
        }

        // Luna: pulsar permite cambiar al tema oscuro.
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.7 8.7 0 1 0 20.2 15.4Z"></path>
            </svg>
        `;
    }

    function actualizarBoton(boton) {
        const oscuro = temaActual() === DARK_THEME;
        const accion = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

        boton.innerHTML = crearIcono(temaActual());
        boton.setAttribute('aria-label', accion);
        boton.setAttribute('title', accion);
        boton.setAttribute('aria-pressed', oscuro ? 'true' : 'false');
    }

    function actualizarBotones() {
        document.querySelectorAll('[data-dark-mode-toggle]').forEach(actualizarBoton);
    }

    function aplicarTema(tema, guardar = false) {
        const nuevoTema = tema === DARK_THEME ? DARK_THEME : LIGHT_THEME;

        document.documentElement.dataset.theme = nuevoTema;
        document.documentElement.style.colorScheme =
            nuevoTema === DARK_THEME ? 'dark' : 'light';

        if (guardar) {
            try {
                localStorage.setItem(STORAGE_KEY, nuevoTema);
            } catch (error) {
                console.warn('No se pudo guardar el tema:', error);
            }
        }

        actualizarBotones();
    }

    function crearBotonGlobal() {
        let boton = document.querySelector('[data-dark-mode-toggle]');

        if (!boton) {
            boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'dark-mode-button';
            boton.dataset.darkModeToggle = '';
            document.body.appendChild(boton);
        }

        if (boton.dataset.darkModeReady === 'true') {
            actualizarBoton(boton);
            return;
        }

        boton.dataset.darkModeReady = 'true';
        boton.addEventListener('click', () => {
            aplicarTema(
                temaActual() === DARK_THEME ? LIGHT_THEME : DARK_THEME,
                true
            );
        });

        actualizarBoton(boton);
    }

    // Se aplica el tema antes de esperar a que el documento termine de cargar.
    aplicarTema(temaInicial());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', crearBotonGlobal, { once: true });
    } else {
        crearBotonGlobal();
    }

    // Sincroniza el tema si cambia en otra pestaña del mismo navegador.
    window.addEventListener('storage', event => {
        if (event.key === STORAGE_KEY) {
            aplicarTema(
                event.newValue === DARK_THEME ? DARK_THEME : LIGHT_THEME
            );
        }
    });
})();