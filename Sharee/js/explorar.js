'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const formUsuarios = document.getElementById('formBuscarUsuarios');
    const formHashtags = document.getElementById('formBuscarHashtags');
    const botonCerrarPanel = document.getElementById('btnCerrarHashtagPosts');

    formUsuarios?.addEventListener('submit', event => {
        event.preventDefault();
        buscarUsuarios();
    });

    formHashtags?.addEventListener('submit', event => {
        event.preventDefault();
        buscarHashtags();
    });

    botonCerrarPanel?.addEventListener('click', cerrarPublicacionesHashtag);

    cargarSugerencias();
});

async function pedirJson(url, opciones = {}) {
    const respuesta = await fetch(url, {
        credentials: 'same-origin',
        ...opciones,
        headers: {
            Accept: 'application/json',
            ...(opciones.headers || {})
        }
    });

    const texto = await respuesta.text();

    let datos;

    try {
        datos = JSON.parse(texto);
    } catch (error) {
        console.error('Respuesta no JSON del servidor:', {
            url,
            status: respuesta.status,
            respuesta: texto.slice(0, 2000)
        });

        throw new Error(
            `El servidor respondió con HTTP ${respuesta.status} y un formato inválido.`
        );
    }

    return { respuesta, datos };
}

async function buscarUsuarios() {
    const input = document.getElementById('searchUsersInput');
    const contenedor = document.getElementById('usuariosResultados');
    const termino = input.value.trim();

    if (!termino) {
        mostrarEstado(contenedor, 'Escribí un nombre o username para buscar.');
        return;
    }

    mostrarEstado(contenedor, 'Buscando usuarios…');

    try {
        const { respuesta, datos } = await pedirJson(
            `/Sharee/api/usuarios/search_users.php?q=${encodeURIComponent(termino)}`
        );

        if (!respuesta.ok || !datos.success) {
            throw new Error(datos.message || 'No se pudo completar la búsqueda.');
        }

        renderizarUsuarios(datos.data || []);
    } catch (error) {
        console.error('Error buscando usuarios:', error);
        mostrarEstado(
            contenedor,
            error.message || 'No se pudo realizar la búsqueda.'
        );
    }
}

function renderizarUsuarios(usuarios) {
    const contenedor = document.getElementById('usuariosResultados');
    contenedor.replaceChildren();

    if (!usuarios.length) {
        mostrarEstado(contenedor, 'No se encontraron usuarios.');
        return;
    }

    usuarios.forEach(usuario => {
        const elemento = document.createElement('article');
        elemento.className = 'result-item';

        const informacion = document.createElement('div');
        informacion.className = 'result-item-info';

        const username = document.createElement('strong');
        username.textContent = `@${usuario.username}`;

        const nombre = document.createElement('span');
        nombre.textContent =
            `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();

        informacion.append(username, nombre);

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'result-button';
        boton.textContent = 'Ver perfil';
        boton.addEventListener('click', () => {
            window.location.href =
                `/Sharee/perfil.html?id=${encodeURIComponent(usuario.id)}`;
        });

        elemento.append(informacion, boton);
        contenedor.appendChild(elemento);
    });
}

async function buscarHashtags() {
    const input = document.getElementById('searchHashtagsInput');
    const contenedor = document.getElementById('hashtagsResultados');
    const termino = input.value.trim();

    if (!termino) {
        mostrarEstado(contenedor, 'Escribí un hashtag para buscar.');
        return;
    }

    mostrarEstado(contenedor, 'Buscando hashtags…');

    try {
        const { respuesta, datos } = await pedirJson(
            `/Sharee/api/hashtags/search_hashtags.php?q=${encodeURIComponent(termino)}`
        );

        if (!respuesta.ok || !datos.success) {
            throw new Error(datos.message || 'No se pudo completar la búsqueda.');
        }

        renderizarHashtags(datos.data || []);
    } catch (error) {
        console.error('Error buscando hashtags:', error);
        mostrarEstado(
            contenedor,
            error.message || 'No se pudo realizar la búsqueda.'
        );
    }
}

function renderizarHashtags(hashtags) {
    const contenedor = document.getElementById('hashtagsResultados');
    contenedor.replaceChildren();

    if (!hashtags.length) {
        mostrarEstado(contenedor, 'No se encontraron hashtags.');
        return;
    }

    hashtags.forEach(hashtag => {
        const elemento = document.createElement('article');
        elemento.className = 'result-item';

        const informacion = document.createElement('div');
        informacion.className = 'result-item-info';

        const nombre = document.createElement('strong');
        nombre.textContent = `#${hashtag.nombre}`;

        const cantidad = Number(hashtag.cantidad_publicaciones) || 0;
        const detalle = document.createElement('span');
        detalle.textContent =
            `${cantidad} ${cantidad === 1 ? 'publicación' : 'publicaciones'}`;

        informacion.append(nombre, detalle);

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'result-button';
        boton.textContent = 'Ver publicaciones';
        boton.addEventListener('click', () => {
            cargarPublicacionesHashtag(hashtag.nombre);
        });

        elemento.append(informacion, boton);
        contenedor.appendChild(elemento);
    });
}

async function cargarPublicacionesHashtag(hashtag) {
    const panel = document.getElementById('hashtagPostsPanel');
    const titulo = document.getElementById('hashtagPostsTitle');
    const descripcion = document.getElementById('hashtagPostsDescription');
    const lista = document.getElementById('hashtagPostsList');

    if (!panel || !titulo || !descripcion || !lista) {
        console.error('Falta el apartado de resultados de hashtags en explorar.html.');
        return;
    }

    panel.hidden = false;
    titulo.textContent = `Publicaciones con #${hashtag}`;
    descripcion.textContent = 'Cargando publicaciones…';
    lista.replaceChildren();

    panel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

    try {
        const { respuesta, datos } = await pedirJson(
            `/Sharee/api/hashtags/get_posts_by_hashtag.php?tag=${encodeURIComponent(hashtag)}`
        );

        if (!respuesta.ok || !datos.success) {
            throw new Error(
                datos.message || 'No se pudieron cargar las publicaciones.'
            );
        }

        const publicaciones = datos.data || [];

        if (!publicaciones.length) {
            descripcion.textContent = 'No hay publicaciones con este hashtag.';
            lista.appendChild(crearEstadoPosts('Todavía no hay publicaciones para este hashtag.'));
            return;
        }

        descripcion.textContent =
            `${publicaciones.length} ${publicaciones.length === 1 ? 'publicación' : 'publicaciones'}`;

        publicaciones.forEach(publicacion => {
            lista.appendChild(crearTarjetaPublicacion(publicacion));
        });
    } catch (error) {
        console.error('Error cargando publicaciones del hashtag:', error);
        descripcion.textContent = 'Ocurrió un problema al cargar los resultados.';
        lista.appendChild(crearEstadoPosts(
            error.message || 'No se pudieron cargar las publicaciones.'
        ));
    }
}

function crearTarjetaPublicacion(publicacion) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'hashtag-post';

    const cabecera = document.createElement('header');
    cabecera.className = 'hashtag-post-header';

    const autor = document.createElement('a');
    autor.className = 'hashtag-post-author';
    autor.href =
        `/Sharee/perfil.html?id=${encodeURIComponent(publicacion.usuario_id)}`;
    autor.textContent =
        `@${publicacion.username} · ${publicacion.nombre || ''} ${publicacion.apellido || ''}`.trim();

    const fecha = document.createElement('time');
    fecha.className = 'hashtag-post-date';
    fecha.textContent = formatearFecha(publicacion.created_at);

    cabecera.append(autor, fecha);
    tarjeta.appendChild(cabecera);

    if (publicacion.contenido) {
        const contenido = document.createElement('p');
        contenido.className = 'hashtag-post-content';
        contenido.textContent = publicacion.contenido;
        tarjeta.appendChild(contenido);
    }

    if (publicacion.imagen_url) {
        const imagen = document.createElement('img');
        imagen.className = 'hashtag-post-image';
        imagen.src = `/Sharee/${publicacion.imagen_url}`;
        imagen.alt = `Imagen publicada por @${publicacion.username}`;
        imagen.loading = 'lazy';
        tarjeta.appendChild(imagen);
    }

    const estadisticas = document.createElement('div');
    estadisticas.className = 'hashtag-post-stats';
    estadisticas.textContent =
        `${Number(publicacion.likes_count) || 0} likes · ` +
        `${Number(publicacion.comments_count) || 0} comentarios`;

    tarjeta.appendChild(estadisticas);
    return tarjeta;
}

function crearEstadoPosts(mensaje) {
    const estado = document.createElement('p');
    estado.className = 'hashtag-posts-empty';
    estado.textContent = mensaje;
    return estado;
}

function cerrarPublicacionesHashtag() {
    const panel = document.getElementById('hashtagPostsPanel');
    const lista = document.getElementById('hashtagPostsList');

    if (panel) panel.hidden = true;
    if (lista) lista.replaceChildren();
}

async function cargarSugerencias() {
    const lista = document.getElementById('suggestionsList');
    if (!lista) return;

    try {
        const { respuesta, datos } = await pedirJson(
            '/Sharee/api/usuarios/get_suggestions.php'
        );

        if (!respuesta.ok || !datos.success) {
            throw new Error(datos.message || 'No se pudieron cargar las sugerencias.');
        }

        renderizarSugerencias(datos.data || []);
    } catch (error) {
        console.error('Error cargando sugerencias:', error);
        mostrarEstado(lista, error.message, true);
    }
}

function renderizarSugerencias(usuarios) {
    const lista = document.getElementById('suggestionsList');
    lista.replaceChildren();

    if (!usuarios.length) {
        mostrarEstado(lista, 'No hay sugerencias disponibles.', true);
        return;
    }

    usuarios.forEach(usuario => {
        const item = document.createElement('li');
        item.className = 'suggestion-item';

        const perfil = document.createElement('a');
        perfil.className = 'suggestion-user';
        perfil.href =
            `/Sharee/perfil.html?id=${encodeURIComponent(usuario.id)}`;

        if (typeof crearAvatarHTML === 'function') {
            const avatar = document.createElement('span');
            avatar.className = 'suggestion-avatar';
            avatar.innerHTML = crearAvatarHTML(usuario, 'avatar-sm');
            perfil.appendChild(avatar);
        }

        const informacion = document.createElement('span');
        informacion.className = 'suggestion-user-info';

        const nombre = document.createElement('strong');
        nombre.textContent =
            `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();

        const username = document.createElement('small');
        username.textContent = `@${usuario.username}`;

        informacion.append(nombre, username);
        perfil.appendChild(informacion);

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'secondary-button btn-follow';
        boton.textContent = 'Seguir';
        boton.addEventListener('click', () => seguirUsuario(usuario.id, boton));

        item.append(perfil, boton);
        lista.appendChild(item);
    });
}

async function seguirUsuario(usuarioId, boton) {
    boton.disabled = true;
    boton.textContent = 'Siguiendo…';

    try {
        const { respuesta, datos } = await pedirJson(
            '/Sharee/api/seguidores/follow.php',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seguido_id: usuarioId })
            }
        );

        if (!respuesta.ok || !datos.success) {
            throw new Error(datos.message || 'No se pudo seguir al usuario.');
        }

        boton.textContent = 'Siguiendo';

        if (typeof window.mostrarAviso === 'function') {
            window.mostrarAviso(datos.message || 'Ahora sigues a este usuario.', 'success');
        }
    } catch (error) {
        console.error('Error siguiendo usuario:', error);
        boton.disabled = false;
        boton.textContent = 'Seguir';

        if (typeof window.mostrarAviso === 'function') {
            window.mostrarAviso(error.message, 'error');
        }
    }
}

function mostrarEstado(contenedor, mensaje, esLista = false) {
    if (!contenedor) return;

    contenedor.replaceChildren();

    const elemento = document.createElement(esLista ? 'li' : 'p');
    elemento.className = esLista ? 'suggestions-status' : 'empty-result';
    elemento.textContent = mensaje;

    contenedor.appendChild(elemento);
}

function formatearFecha(valor) {
    if (!valor) return '';

    const fecha = new Date(String(valor).replace(' ', 'T'));

    if (Number.isNaN(fecha.getTime())) {
        return String(valor);
    }

    return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}