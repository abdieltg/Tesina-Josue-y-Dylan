'use strict';

const INTERVALO_ACTUALIZACION_MS = 5000;
let intervaloAdmin = null;
let cargandoPanel = false;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnRecargar')
        ?.addEventListener('click', () => cargarPanel(false));

    document.getElementById('listaUsuarios')
        ?.addEventListener('click', manejarAccionUsuario);

    document.getElementById('listaPublicaciones')
        ?.addEventListener('click', manejarAccionPublicacion);

    cargarPanel(false);

    intervaloAdmin = window.setInterval(() => {
        cargarPanel(true);
    }, INTERVALO_ACTUALIZACION_MS);
});

window.addEventListener('beforeunload', () => {
    if (intervaloAdmin !== null) {
        window.clearInterval(intervaloAdmin);
    }
});

async function pedirJson(url, opciones = {}) {
    const respuesta = await fetch(url, {
        credentials: 'same-origin',
        ...opciones,
        headers: {
            'Accept': 'application/json',
            ...(opciones.headers || {})
        }
    });

    const texto = await respuesta.text();

    let data;
    try {
        data = JSON.parse(texto);
    } catch (error) {
        console.error('Respuesta no JSON del servidor:', {
            url,
            status: respuesta.status,
            respuesta: texto.slice(0, 2000)
        });

        throw new Error(`El servidor respondió con HTTP ${respuesta.status}.`);
    }

    return { respuesta, data };
}

async function cargarPanel(silencioso) {
    if (cargandoPanel) return;
    cargandoPanel = true;

    const usuarios = document.getElementById('listaUsuarios');
    const publicaciones = document.getElementById('listaPublicaciones');

    try {
        const { respuesta, data } = await pedirJson('/Sharee/api/admin/panel.php');

        if (!respuesta.ok || !data.success) {
            throw new Error(data.message || 'No se pudo cargar el panel.');
        }

        renderizarUsuarios(data.data.usuarios || []);
        renderizarPublicaciones(data.data.publicaciones || []);

        if (!silencioso) {
            mostrarMensaje('Panel actualizado.', 'success');
        }
    } catch (error) {
        console.error('Error cargando administración:', error);

        if (!silencioso) {
            mostrarMensaje(error.message, 'error');
        }

        if (usuarios && !usuarios.children.length) {
            usuarios.replaceChildren(crearFilaMensaje(error.message, 4));
        }

        if (publicaciones && !publicaciones.children.length) {
            publicaciones.textContent = error.message;
        }
    } finally {
        cargandoPanel = false;
    }
}

function renderizarUsuarios(lista) {
    const tbody = document.getElementById('listaUsuarios');
    if (!tbody) return;

    const filasActuales = new Map(
        [...tbody.querySelectorAll('tr[data-user-id]')]
            .map(fila => [String(fila.dataset.userId), fila])
    );

    if (lista.length === 0) {
        tbody.replaceChildren(crearFilaMensaje('Todavía no hay usuarios.', 4));
        return;
    }

    const filasNuevas = lista.map(usuario => {
        const fila = filasActuales.get(String(usuario.id)) || document.createElement('tr');
        fila.dataset.userId = usuario.id;
        fila.replaceChildren();

        const celdaUsuario = document.createElement('td');
        celdaUsuario.textContent =
            `${usuario.nombre || ''} ${usuario.apellido || ''} (@${usuario.username || ''})`;

        const celdaEmail = document.createElement('td');
        celdaEmail.textContent = usuario.email || '';

        const celdaRol = document.createElement('td');
        const insignia = document.createElement('span');
        insignia.className = usuario.role === 'admin'
            ? 'role-badge role-admin'
            : 'role-badge';
        insignia.textContent = usuario.role === 'admin' ? 'Administrador' : 'Usuario';
        celdaRol.appendChild(insignia);

        const celdaAccion = document.createElement('td');
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'admin-button admin-button-small';
        boton.dataset.userId = usuario.id;
        boton.dataset.role = usuario.role === 'admin' ? 'user' : 'admin';
        boton.textContent = usuario.role === 'admin'
            ? 'Quitar administrador'
            : 'Hacer administrador';
        celdaAccion.appendChild(boton);

        fila.append(celdaUsuario, celdaEmail, celdaRol, celdaAccion);
        return fila;
    });

    tbody.replaceChildren(...filasNuevas);
}

function renderizarPublicaciones(lista) {
    const contenedor = document.getElementById('listaPublicaciones');
    if (!contenedor) return;

    const tarjetasActuales = new Map(
        [...contenedor.querySelectorAll('.admin-post[data-post-id]')]
            .map(tarjeta => [String(tarjeta.dataset.postId), tarjeta])
    );

    if (lista.length === 0) {
        contenedor.textContent = 'Todavía no hay publicaciones.';
        return;
    }

    const tarjetas = lista.map(publicacion => {
        const tarjeta =
            tarjetasActuales.get(String(publicacion.id)) ||
            document.createElement('article');

        tarjeta.className = 'admin-post';
        tarjeta.dataset.postId = publicacion.id;
        tarjeta.replaceChildren();

        const encabezado = document.createElement('div');
        encabezado.className = 'admin-post-heading';

        const autor = document.createElement('strong');
        autor.textContent =
            `@${publicacion.username} · ${publicacion.nombre || ''} ${publicacion.apellido || ''}`;

        const fecha = document.createElement('small');
        fecha.textContent = publicacion.created_at || '';
        encabezado.append(autor, fecha);

        const contenido = document.createElement('p');
        contenido.textContent = publicacion.contenido || '(Publicación con imagen)';

        tarjeta.append(encabezado, contenido);

        if (publicacion.imagen_url) {
            const imagen = document.createElement('img');
            imagen.className = 'admin-post-image';
            imagen.src = `/Sharee/${publicacion.imagen_url}`;
            imagen.alt = 'Imagen de la publicación';
            imagen.loading = 'lazy';
            tarjeta.appendChild(imagen);
        }

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'admin-button admin-button-danger';
        boton.dataset.postId = publicacion.id;
        boton.textContent = 'Eliminar publicación';
        tarjeta.appendChild(boton);

        return tarjeta;
    });

    contenedor.replaceChildren(...tarjetas);
}

async function manejarAccionUsuario(event) {
    const boton = event.target.closest('button[data-user-id]');
    if (!boton) return;

    const usuarioId = Number(boton.dataset.userId);
    const rolNuevo = boton.dataset.role;

    if (!usuarioId || !['admin', 'user'].includes(rolNuevo)) return;

    const textoAnterior = boton.textContent;
    boton.disabled = true;
    boton.textContent = 'Guardando…';

    try {
        const { respuesta, data } = await pedirJson('/Sharee/api/admin/panel.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'set_role',
                user_id: usuarioId,
                role: rolNuevo
            })
        });

        if (!respuesta.ok || !data.success) {
            throw new Error(data.message || 'No se pudo cambiar el rol.');
        }

        // Cambia esta fila inmediatamente, sin recargar ni volver a pedir toda la página.
        actualizarFilaRol(boton.closest('tr'), rolNuevo);
        mostrarMensaje(data.message, 'success');
    } catch (error) {
        console.error('Error cambiando rol:', error);
        boton.disabled = false;
        boton.textContent = textoAnterior;
        mostrarMensaje(error.message, 'error');
    }
}

function actualizarFilaRol(fila, rol) {
    if (!fila) return;

    const insignia = fila.querySelector('.role-badge');
    const boton = fila.querySelector('button[data-user-id]');

    if (insignia) {
        insignia.className = rol === 'admin'
            ? 'role-badge role-admin'
            : 'role-badge';
        insignia.textContent = rol === 'admin' ? 'Administrador' : 'Usuario';
    }

    if (boton) {
        boton.dataset.role = rol === 'admin' ? 'user' : 'admin';
        boton.textContent = rol === 'admin'
            ? 'Quitar administrador'
            : 'Hacer administrador';
        boton.disabled = false;
    }
}

async function manejarAccionPublicacion(event) {
    const boton = event.target.closest('button[data-post-id]');
    if (!boton) return;

    const publicacionId = Number(boton.dataset.postId);
    if (!publicacionId) return;

    if (!window.confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) {
        return;
    }

    boton.disabled = true;

    try {
        const { respuesta, data } = await pedirJson(
            '/Sharee/api/publicaciones/delete_post.php',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicacion_id: publicacionId })
            }
        );

        if (!respuesta.ok || !data.success) {
            throw new Error(data.message || 'No se pudo eliminar la publicación.');
        }

        // Quita la tarjeta inmediatamente al recibir éxito del servidor.
        const tarjeta = boton.closest('.admin-post');
        tarjeta?.remove();

        const contenedor = document.getElementById('listaPublicaciones');
        if (contenedor && !contenedor.querySelector('.admin-post')) {
            contenedor.textContent = 'Todavía no hay publicaciones.';
        }

        mostrarMensaje(data.message, 'success');
    } catch (error) {
        console.error('Error eliminando publicación:', error);
        boton.disabled = false;
        mostrarMensaje(error.message, 'error');
    }
}

function crearFilaMensaje(texto, columnas) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = columnas;
    celda.textContent = texto;
    fila.appendChild(celda);
    return fila;
}

function mostrarMensaje(texto, tipo = '') {
    const elemento = document.getElementById('mensajeAdmin');
    if (!elemento) return;

    elemento.textContent = texto;
    elemento.className = texto
        ? `admin-message ${tipo} visible`
        : 'admin-message';
}