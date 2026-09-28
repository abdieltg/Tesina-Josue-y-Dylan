let usuarioActualId = null;
let usuarioViendoId = null;

document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    usuarioViendoId = params.get('id');

    const profileResponse = await fetch('/Sharee/api/usuarios/get_profile.php');
    const profileData = await profileResponse.json();
    if (profileData.success) {
        usuarioActualId = profileData.data.id;
    }

    await cargarPerfil();

    document.getElementById('statPosts').addEventListener('click', mostrarPublicaciones);
    document.getElementById('statSeguidores').addEventListener('click', () => mostrarSeguidores('seguidores'));
    document.getElementById('statSeguidos').addEventListener('click', () => mostrarSeguidores('seguidos'));
    document.getElementById('btnCerrar').addEventListener('click', cerrarModal);
});

async function cargarPerfil() {
    try {
        let url = '/Sharee/api/usuarios/get_profile.php';
        if (usuarioViendoId) {
            url += `?usuario_id=${usuarioViendoId}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            console.error(data.message || 'No se pudo cargar el perfil');
            return;
        }

        const usuario = data.data;
        const esPerfil = !usuarioViendoId || usuarioViendoId == usuarioActualId;

        const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Usuario';

        // IMPORTANTE: Usar actualizarAvatarElemento en lugar de .textContent
        actualizarAvatarElemento(
            document.getElementById('perfilAvatar'),
            usuario,
            'avatar-lg'
        );

        document.getElementById('perfilNombre').textContent = nombreCompleto;
        document.getElementById('perfilUsername').textContent = `@${usuario.username || 'usuario'}`;
        document.getElementById('perfilBio').textContent = usuario.bio || 'Sin biografía aún.';
        document.getElementById('perfilNombreReal').textContent = usuario.nombre || '-';
        document.getElementById('perfilApellido').textContent = usuario.apellido || '-';
        document.getElementById('perfilFecha').textContent = formatearFecha(usuario.created_at);

        const liEmail = document.getElementById('liEmail');
        if (esPerfil && usuario.email) {
            document.getElementById('perfilEmail').textContent = usuario.email;
            liEmail.style.display = 'block';
        } else {
            liEmail.style.display = 'none';
        }

        document.getElementById('totalPosts').textContent = usuario.total_posts;
        document.getElementById('totalSeguidores').textContent = usuario.total_seguidores;
        document.getElementById('totalSeguidos').textContent = usuario.total_seguidos;

        if (!esPerfil) {
            await cargarAccionesUsuario(usuario.id);
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

async function cargarAccionesUsuario(usuarioId) {
    const accionesDiv = document.getElementById('perfilAcciones');

    try {
        const response = await fetch('/Sharee/api/seguidores/get_followers.php');
        const data = await response.json();

        if (!data.success) {
            return;
        }

        const yaSigue = data.data.seguidos.some(u => u.id == usuarioId);

        if (yaSigue) {
            accionesDiv.innerHTML = `
                <button class="secondary-button" id="btnDejarSeguir" style="width: 100%;">
                    Dejar de seguir
                </button>
            `;
            document.getElementById('btnDejarSeguir').addEventListener('click', async function () {
                await dejarSeguir(usuarioId);
            });
        } else {
            accionesDiv.innerHTML = `
                <button class="primary-button" id="btnSeguir" style="width: 100%;">
                    Seguir
                </button>
            `;
            document.getElementById('btnSeguir').addEventListener('click', async function () {
                await seguir(usuarioId);
            });
        }
    } catch (error) {
        console.error('Error cargando acciones:', error);
    }
}

async function mostrarPublicaciones() {
    const usuarioId = usuarioViendoId || usuarioActualId;

    try {
        const response = await fetch(`/Sharee/api/publicaciones/get_user_posts.php?usuario_id=${usuarioId}`);
        const data = await response.json();

        const section = document.getElementById('postSection');
        const list = document.getElementById('postsList');

        if (!data.success || !data.data || data.data.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--color-texto-secundario);">No hay publicaciones.</p>';
            section.style.display = 'block';
            return;
        }

        list.innerHTML = data.data.map(post => `
            <div class="post-item">
                <strong>${post.nombre} ${post.apellido}</strong>
                <p>${escapeHtml(post.contenido)}</p>
                <div class="post-meta">
                    ${post.likes_count} likes · ${post.comments_count} comentarios · ${formatearFecha(post.created_at)}
                </div>
            </div>
        `).join('');

        section.style.display = 'block';
        document.getElementById('followersSection').style.display = 'none';
    } catch (error) {
        console.error('Error cargando publicaciones:', error);
    }
}

async function mostrarSeguidores(tipo) {
    const usuarioId = usuarioViendoId || usuarioActualId;

    try {
        const response = await fetch(`/Sharee/api/seguidores/get_follower_list.php?usuario_id=${usuarioId}&tipo=${tipo}`);
        const data = await response.json();

        const section = document.getElementById('followersSection');
        const list = document.getElementById('followersList');
        const title = document.getElementById('followersTitle');

        if (tipo === 'seguidores') {
            title.textContent = 'Seguidores';
        } else {
            title.textContent = 'Seguidos';
        }

        if (!data.success || !data.data || data.data.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--color-texto-secundario);">No hay usuarios.</p>';
            section.style.display = 'block';
            document.getElementById('postSection').style.display = 'none';
            return;
        }

        list.innerHTML = data.data.map(usuario => `
            <div class="follower-item" data-user-id="${usuario.id}">
                <div class="follower-info">
                    <div class="follower-avatar-container">
                        ${crearAvatarHTML(usuario, 'avatar-follower')}
                    </div>
                    <div class="follower-details">
                        <strong>${usuario.nombre} ${usuario.apellido}</strong>
                        <small>@${usuario.username}</small>
                    </div>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.follower-item').forEach(item => {
            item.addEventListener('click', function () {
                const userId = this.dataset.userId;
                window.location.href = `/Sharee/perfil.html?id=${userId}`;
            });
        });

        section.style.display = 'block';
        document.getElementById('postSection').style.display = 'none';
    } catch (error) {
        console.error('Error cargando seguidores:', error);
    }
}

function cerrarModal() {
    document.getElementById('postSection').style.display = 'none';
    document.getElementById('followersSection').style.display = 'none';
}

async function seguir(usuarioId) {
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
            await cargarAccionesUsuario(usuarioId);
        } else {
            alert(data.message || 'No se pudo seguir');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al seguir');
    }
}

async function dejarSeguir(usuarioId) {
    try {
        const response = await fetch('/Sharee/api/seguidores/unfollow.php', {
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
            await cargarAccionesUsuario(usuarioId);
        } else {
            alert(data.message || 'No se pudo dejar de seguir');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al dejar de seguir');
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '-';

    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return String(text).replace(/[&<>"']/g, char => map[char]);
}