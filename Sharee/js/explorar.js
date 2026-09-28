document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btnBuscarUsuarios').addEventListener('click', buscarUsuarios);
    document.getElementById('btnBuscarHashtags').addEventListener('click', buscarHashtags);

    document.getElementById('searchUsersInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') buscarUsuarios();
    });

    document.getElementById('searchHashtagsInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') buscarHashtags();
    });

    cargarSugerencias();
});

async function buscarUsuarios() {
    const input = document.getElementById('searchUsersInput');
    const termino = input.value.trim();

    if (!termino) {
        mostrarUsuariosVacios('Ingresá un nombre o username para buscar.');
        return;
    }

    try {
        const response = await fetch(`/Sharee/api/usuarios/search_users.php?q=${encodeURIComponent(termino)}`);
        const data = await response.json();

        const contenedor = document.getElementById('usuariosResultados');

        if (!data.success || !data.data || data.data.length === 0) {
            contenedor.innerHTML = `<div class="empty-result">No se encontraron usuarios.</div>`;
            return;
        }

        contenedor.innerHTML = data.data.map(usuario => `
            <div class="result-item">
                <div>
                    <strong>@${usuario.username}</strong>
                    <span>${usuario.nombre} ${usuario.apellido}</span>
                </div>
                <button class="result-button" data-user-id="${usuario.id}" type="button">Ver perfil</button>
            </div>
        `).join('');

        contenedor.querySelectorAll('.result-button').forEach(button => {
            button.addEventListener('click', function () {
                const userId = this.dataset.userId;
                window.location.href = `/Sharee/perfil.html?id=${userId}`;
            });
        });
    } catch (error) {
        console.error('Error buscando usuarios:', error);
        mostrarUsuariosVacios('No se pudo realizar la búsqueda.');
    }
}

async function buscarHashtags() {
    const input = document.getElementById('searchHashtagsInput');
    const termino = input.value.trim();

    if (!termino) {
        mostrarHashtagsVacios('Ingresá un hashtag para buscar.');
        return;
    }

    try {
        const response = await fetch(`/Sharee/api/hashtags/search_hashtags.php?q=${encodeURIComponent(termino)}`);
        const data = await response.json();

        const contenedor = document.getElementById('hashtagsResultados');

        if (!data.success || !data.data || data.data.length === 0) {
            contenedor.innerHTML = `<div class="empty-result">No se encontraron hashtags.</div>`;
            return;
        }

        contenedor.innerHTML = data.data.map(tag => `
            <div class="result-item">
                <div>
                    <strong>#${tag.nombre}</strong>
                    <span>${tag.cantidad_publicaciones} publicaciones</span>
                </div>
                <button class="result-button" type="button" data-tag="${tag.nombre}">Ver</button>
            </div>
        `).join('');

        contenedor.querySelectorAll('.result-button').forEach(button => {
            button.addEventListener('click', function () {
                const tag = this.dataset.tag;
                alert(`Mostrando publicaciones con #${tag}`);
            });
        });
    } catch (error) {
        console.error('Error buscando hashtags:', error);
        mostrarHashtagsVacios('No se pudo realizar la búsqueda.');
    }
}

async function cargarSugerencias() {
    const list = document.getElementById('suggestionsList');

    if (!list) {
        return;
    }

    try {
        const response = await fetch('/Sharee/api/usuarios/get_suggestions.php');
        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            list.innerHTML = '<li style="text-align: center; color: var(--color-texto-secundario); padding: 1rem;">No hay sugerencias disponibles.</li>';
            return;
        }

        list.innerHTML = data.data.map(usuario => {
            const avatarUrl = usuario.avatar_url;
            const avatarInicial = (usuario.username || 'U').charAt(0).toUpperCase();

            return `
                <li>
                    <div class="user-row">
                        ${
                            avatarUrl
                                ? `<img src="/Sharee/${avatarUrl}" alt="${usuario.username}" class="avatar-img avatar-sm">`
                                : `<div class="avatar avatar-sm">${avatarInicial}</div>`
                        }
                        <div>
                            <strong>${usuario.nombre} ${usuario.apellido}</strong>
                            <small>@${usuario.username}</small>
                        </div>
                    </div>
                    <button type="button" class="secondary-button btn-follow" data-user-id="${usuario.id}">
                        Seguir
                    </button>
                </li>
            `;
        }).join('');

        list.querySelectorAll('.btn-follow').forEach(button => {
            button.addEventListener('click', async function () {
                const userId = this.dataset.userId;
                await seguirUsuario(userId, this);
            });
        });
    } catch (error) {
        console.error('Error cargando sugerencias:', error);
        list.innerHTML = '<li style="text-align: center; color: red; padding: 1rem;">Error al cargar sugerencias.</li>';
    }
}
async function seguirUsuario(usuarioId, button) {
    try {
        const response = await fetch('/Sharee/api/seguidores/follow.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                seguido_id: usuarioId
            })
        });

        const data = await response.json();

        if (data.success) {
            button.textContent = 'Siguiendo';
            button.disabled = true;
            await cargarSugerencias();
        } else {
            console.error(data.message);
            alert(data.message || 'No se pudo seguir al usuario');
        }
    } catch (error) {
        console.error('Error siguiendo usuario:', error);
        alert('Error al seguir usuario');
    }
}

function mostrarUsuariosVacios(mensaje) {
    document.getElementById('usuariosResultados').innerHTML =
        `<div class="empty-result">${mensaje}</div>`;
}

function mostrarHashtagsVacios(mensaje) {
    document.getElementById('hashtagsResultados').innerHTML =
        `<div class="empty-result">${mensaje}</div>`;
}