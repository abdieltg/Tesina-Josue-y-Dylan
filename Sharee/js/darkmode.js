(function () {
    const STORAGE_KEY = 'sharee-theme';

    function makeIcon(isDark) {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                <path d="${isDark
                    ? 'M12 3.5a.75.75 0 0 1 .75.75v1.2a.75.75 0 0 1-1.5 0V4.25A.75.75 0 0 1 12 3.5Zm0 14.75a.75.75 0 0 1 .75.75v1.2a.75.75 0 0 1-1.5 0v-1.2a.75.75 0 0 1 .75-.75Zm7.5-6.75a.75.75 0 0 1 .75.75.75.75 0 0 1-.75.75h-1.2a.75.75 0 0 1 0-1.5h1.2ZM6.7 6.7a.75.75 0 0 1 1.06 0l.85.85a.75.75 0 1 1-1.06 1.06L6.7 7.76A.75.75 0 0 1 6.7 6.7Zm10.6 10.6a.75.75 0 0 1 1.06 0l.85.85a.75.75 0 1 1-1.06 1.06l-.85-.85a.75.75 0 0 1 0-1.06ZM4.25 12a.75.75 0 0 1 .75-.75h1.2a.75.75 0 0 1 0 1.5H5A.75.75 0 0 1 4.25 12Zm13.5 0a.75.75 0 0 1 .75-.75h1.2a.75.75 0 0 1 0 1.5h-1.2a.75.75 0 0 1-.75-.75Zm-9.8-4.3a.75.75 0 0 1 1.06 0l.85.85a.75.75 0 1 1-1.06 1.06l-.85-.85a.75.75 0 0 1 0-1.06Zm7.5 7.5a.75.75 0 0 1 1.06 0l.85.85a.75.75 0 1 1-1.06 1.06l-.85-.85a.75.75 0 0 1 0-1.06ZM12 7.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 0 1 0-9Z'
                    : 'M20.5 14.5a7.5 7.5 0 0 1-9.8-9.8a8.5 8.5 0 1 0 9.8 9.8Z'}"
                fill="currentColor"/>
            </svg>
        `;
    }

    function aplicarTema(tema) {
        if (tema === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        actualizarTodosBotones();
    }

    function obtenerTemaInicial() {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado) return guardado;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function actualizarBoton(boton) {
        const oscuro = document.documentElement.getAttribute('data-theme') === 'dark';
        boton.innerHTML = makeIcon(oscuro);
        boton.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }

    function actualizarTodosBotones() {
        document.querySelectorAll('[data-dark-mode-toggle]').forEach(actualizarBoton);
    }

    function alternarTema() {
        const oscuro = document.documentElement.getAttribute('data-theme') === 'dark';
        const nuevoTema = oscuro ? 'light' : 'dark';
        aplicarTema(nuevoTema);
        localStorage.setItem(STORAGE_KEY, nuevoTema);
    }

    function configurarBotones() {
        document.querySelectorAll('[data-dark-mode-toggle]').forEach((boton) => {
            if (!boton.dataset.configurado) {
                boton.addEventListener('click', alternarTema);
                boton.dataset.configurado = 'true';
                actualizarBoton(boton);
            }
        });
    }

    aplicarTema(obtenerTemaInicial());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', configurarBotones);
    } else {
        configurarBotones();
    }
})();