'use strict';

(() => {
    let contadorAvisos = 0;

    function obtenerContenedor() {
        let contenedor = document.getElementById('avisosSharee');

        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'avisosSharee';
            contenedor.className = 'avisos-sharee';
            contenedor.setAttribute('aria-live', 'polite');
            contenedor.setAttribute('aria-label', 'Avisos');
            document.body.appendChild(contenedor);
        }

        return contenedor;
    }

    window.mostrarAviso = function (mensaje, tipo = 'info', duracion = 4000) {
        const aviso = document.createElement('div');
        aviso.id = `aviso-sharee-${++contadorAvisos}`;
        aviso.className = `aviso-sharee aviso-${tipo}`;
        aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');

        const texto = document.createElement('span');
        texto.className = 'aviso-sharee-texto';
        texto.textContent = String(mensaje);

        const cerrar = document.createElement('button');
        cerrar.type = 'button';
        cerrar.className = 'aviso-sharee-cerrar';
        cerrar.setAttribute('aria-label', 'Cerrar aviso');
        cerrar.textContent = '×';
        cerrar.addEventListener('click', () => aviso.remove());

        aviso.append(texto, cerrar);
        obtenerContenedor().appendChild(aviso);

        if (duracion > 0) {
            window.setTimeout(() => aviso.remove(), duracion);
        }

        return aviso.id;
    };

    // Compatibilidad para no tener que reescribir todos los scripts existentes.
    window.alert = mensaje => window.mostrarAviso(mensaje, 'info');

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            obtenerContenedor,
            { once: true }
        );
    } else {
        obtenerContenedor();
    }
})();