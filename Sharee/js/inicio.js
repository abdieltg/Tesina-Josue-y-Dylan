let currentEditingPostId = null;
let currentEditingCommentId = null;
let currentDeletingItem = null;
let imagenSeleccionada = null;

document.addEventListener('DOMContentLoaded', function () {
    configurarModales();
    configurarCargaImagen();
    configurarFormulario();
    cargarPublicaciones();
    cargarNombreUsuario();
    cargarSugerencias();
});

function configurarCargaImagen() {
    const input = document.getElementById('postImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');
    const imageName = document.getElementById('imageName');
    const removeButton = document.getElementById('removeImageButton');

    if (!input) return;

    input.addEventListener('change', function () {
        const archivo = this.files[0];

        if (!archivo) return;

        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        const limiteBytes = 5 * 1024 * 1024;

        if (!tiposPermitidos.includes(archivo.type)) {
            mostrarToast('Solo se permiten imágenes JPG, PNG o WEBP', 'error');
            limpiarImagenSeleccionada();
            return;
        }

        if (archivo.size > limiteBytes) {
            mostrarToast('La imagen no puede superar los 5 MB', 'error');
            limpiarImagenSeleccionada();
            return;
        }

        imagenSeleccionada = archivo;
        imageName.textContent = archivo.name;

        const lector = new FileReader();
        lector.onload = function (event) {
            preview.src = event.target.result;
            previewContainer.style.display = 'block';
        };
        lector.readAsDataURL(archivo);
    });

    removeButton.addEventListener('click', limpiarImagenSeleccionada);
}

function limpiarImagenSeleccionada() {
    const input = document.getElementById('postImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');
    const imageName = document.getElementById('imageName');

    imagenSeleccionada = null;
    if (input) input.value = '';
    if (preview) preview.src = '';
    if (imageName) imageName.textContent = '';
    if (previewContainer) previewContainer.style.display = 'none';
}

function configurarModales() {
    // Modal Editar Post
    document.getElementById('cerrarModalPost').addEventListener('click', cerrarModalEditarPost);
    document.getElementById('cancelarEditPost').addEventListener('click', cerrarModalEditarPost);
    document.getElementById('formEditarPost').addEventListener('submit', guardarEditPost);
    document.getElementById('editPostContent').addEventListener('input', actualizarContadorPost);

    // Modal Editar Comentario
    document.getElementById('cerrarModalComentario').addEventListener('click', cerrarModalEditarComentario);
    document.getElementById('cancelarEditComentario').addEventListener('click', cerrarModalEditarComentario);
    document.getElementById('formEditarComentario').addEventListener('submit', guardarEditComentario);
    document.getElementById('editCommentContent').addEventListener('input', actualizarContadorComentario);

    // Modal Confirmación
    document.getElementById('cerrarModalConfirmacion').addEventListener('click', cerrarModalConfirmacion);
    document.getElementById('cancelarConfirmacion').addEventListener('click', cerrarModalConfirmacion);
    document.getElementById('confirmarAccion').addEventListener('click', ejecutarEliminar);

    // Cerrar modal al hacer click fuera
    document.getElementById('modalEditarPost').addEventListener('click', (e) => {
        if (e.target.id === 'modalEditarPost') cerrarModalEditarPost();
    });

    document.getElementById('modalEditarComentario').addEventListener('click', (e) => {
        if (e.target.id === 'modalEditarComentario') cerrarModalEditarComentario();
    });

    document.getElementById('modalConfirmacion').addEventListener('click', (e) => {
        if (e.target.id === 'modalConfirmacion') cerrarModalConfirmacion();
    });

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModalEditarPost();
            cerrarModalEditarComentario();
            cerrarModalConfirmacion();
        }
    });
}

function configurarFormulario() {
    const form = document.getElementById('formPublicacion');

    if (!form) return;

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const contenido = document.getElementById('postContent').value.trim();
        const hashtags = document.getElementById('postHashtags').value.trim();
        const boton = document.getElementById('btnPublicar');

        if (!contenido && !imagenSeleccionada) {
            mostrarToast('Escribe algo o selecciona una imagen para publicar', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('contenido', contenido);
        formData.append('hashtags', hashtags);

        if (imagenSeleccionada) {
            formData.append('imagen', imagenSeleccionada);
        }

        boton.disabled = true;
        boton.textContent = 'Publicando...';

        try {
            const response = await fetch('/Sharee/api/publicaciones/create_post.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!data.success) {
                mostrarToast(data.message || 'No se pudo crear la publicación', 'error');
                return;
            }

            form.reset();
            limpiarImagenSeleccionada();
            mostrarToast('✅ Publicación creada correctamente', 'exito');
            await cargarPublicaciones();
        } catch (error) {
            console.error('Error al crear publicación:', error);
            mostrarToast('❌ No se pudo crear la publicación', 'error');
        } finally {
            boton.disabled = false;
            boton.textContent = 'Publicar';
        }
    });
}

async function cargarPublicaciones() {
    const feed = document.getElementById('feed');

    if (!feed) return;

    try {
        const response = await fetch('/Sharee/api/publicaciones/get_posts.php');
        const data = await response.json();

        if (!data.success) {
            feed.innerHTML = `<div class="empty-state">${data.message || 'No se pudieron cargar las publicaciones.'}</div>`;
            return;
        }

        if (!data.data || data.data.length === 0) {
            feed.innerHTML = `<div class="empty-state">Todavía no hay publicaciones. ¡Sé el primero en compartir!</div>`;
            return;
        }

        feed.innerHTML = data.data.map(renderPublicacion).join('');
        activarEventosLikes();
        activarEventosComentarios();
        activarClicksUsuarios();
        activarEventosEdicion();
    } catch (error) {
        console.error('Error cargando publicaciones:', error);
        feed.innerHTML = `<div class="empty-state">No se pudieron cargar las publicaciones.</div>`;
    }
}

function renderPublicacion(publicacion) {
    const nombreCompleto = `${publicacion.nombre || ''} ${publicacion.apellido || ''}`.trim() || 'Usuario';
    const username = publicacion.username || 'usuario';

    const hashtagsHtml = (publicacion.hashtags || [])
        .map(tag => `<span class="hashtag">#${tag}</span>`)
        .join(' ');

    const imagenHtml = publicacion.imagen_url
        ? `<div class="post-image-wrapper">
            <img src="/Sharee/${escaparHtml(publicacion.imagen_url)}" 
                 alt="Imagen publicada por ${escaparHtml(username)}" 
                 class="post-image" 
                 loading="lazy">
           </div>`
        : '';

    const botonesEdicion = publicacion.is_owner ? `
        <button type="button" class="action-button edit-post-btn" data-publicacion-id="${publicacion.id}">
            ✏️ Editar
        </button>
        <button type="button" class="action-button delete-post-btn" data-publicacion-id="${publicacion.id}" style="color: #e74c3c;">
            🗑️ Eliminar
        </button>
    ` : '';

    return `
        <article class="post-card" data-post-id="${publicacion.id}" data-is-owner="${publicacion.is_owner ? 'true' : 'false'}">
            <div class="post-header">
                <div class="post-user">
                    <div class="post-avatar" data-user-id="${publicacion.usuario_id}">
                        ${crearAvatarHTML(publicacion, 'avatar-md')}
                    </div>
                    <div class="post-meta">
                        <strong class="user-link" data-user-id="${publicacion.usuario_id}">
                            ${escaparHtml(nombreCompleto)}
                        </strong>
                        <small>@${escaparHtml(username)} · ${formatearFecha(publicacion.created_at)}</small>
                    </div>
                </div>
            </div>

            <div class="post-body">
                ${publicacion.contenido ? `<div class="post-content">${escaparHtml(publicacion.contenido)}</div>` : ''}
                ${imagenHtml}
                ${hashtagsHtml ? `<div class="post-hashtags">${hashtagsHtml}</div>` : ''}
            </div>

            <div class="post-stats">
                <span class="like-count">${publicacion.likes_count || 0} likes</span>
                <span class="comment-count">${publicacion.comments_count || 0} comentarios</span>
            </div>

            <div class="post-actions">
                <button type="button" class="action-button like-button" data-publicacion-id="${publicacion.id}">
                    ${publicacion.is_liked ? '❤️ Te gusta' : '🤍 Me gusta'}
                </button>
                <button type="button" class="action-button toggle-comments" data-publicacion-id="${publicacion.id}">
                    💬 Comentarios
                </button>
                ${botonesEdicion}
            </div>

            <div class="comments-container" data-comments-for="${publicacion.id}" style="display:none;">
                <div class="comments-list"></div>
                <form class="comment-form" data-publicacion-id="${publicacion.id}">
                    <input type="text" class="comment-input" placeholder="Escribí un comentario..." maxlength="250">
                    <button type="submit" class="comment-submit">Enviar</button>
                </form>
            </div>
        </article>
    `;
}

function activarEventosEdicion() {
    document.querySelectorAll('.edit-post-btn').forEach(btn => {
        btn.addEventListener('click', abrirModalEditarPost);
    });

    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', abrirConfirmacionEliminarPost);
    });
}

function abrirModalEditarPost(e) {
    e.stopPropagation();
    const publicacionId = this.dataset.publicacionId;
    const card = document.querySelector(`.post-card[data-post-id="${publicacionId}"]`);
    const contenido = card.querySelector('.post-content')?.textContent || '';

    currentEditingPostId = publicacionId;
    document.getElementById('editPostContent').value = contenido;
    document.getElementById('editPostContent').focus();
    actualizarContadorPost();
    document.getElementById('modalEditarPost').classList.add('active');
}

function cerrarModalEditarPost() {
    document.getElementById('modalEditarPost').classList.remove('active');
    currentEditingPostId = null;
    document.getElementById('formEditarPost').reset();
}

function actualizarContadorPost() {
    const textarea = document.getElementById('editPostContent');
    const contador = document.getElementById('charCountPost');
    const count = textarea.value.length;
    contador.textContent = count;
    contador.parentElement.classList.remove('warning', 'danger');
    if (count > 450) contador.parentElement.classList.add('danger');
    else if (count > 400) contador.parentElement.classList.add('warning');
}

async function guardarEditPost(e) {
    e.preventDefault();

    if (!currentEditingPostId) return;

    const contenido = document.getElementById('editPostContent').value.trim();

    if (!contenido) {
        mostrarToast('La publicación no puede estar vacía', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        const response = await fetch('/Sharee/api/publicaciones/update_post.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                publicacion_id: currentEditingPostId,
                contenido: contenido
            })
        });

        const data = await response.json();

        if (data.success) {
            const card = document.querySelector(`.post-card[data-post-id="${currentEditingPostId}"]`);
            if (card) {
                const postBody = card.querySelector('.post-body');
                const contentDiv = postBody.querySelector('.post-content');
                
                if (contentDiv) {
                    contentDiv.textContent = contenido;
                } else {
                    const newContent = document.createElement('div');
                    newContent.className = 'post-content';
                    newContent.textContent = contenido;
                    postBody.insertBefore(newContent, postBody.firstChild);
                }
                
                contentDiv.style.animation = 'none';
                setTimeout(() => {
                    if (contentDiv) contentDiv.style.animation = 'fadeIn 0.3s ease';
                }, 10);
            }
            
            cerrarModalEditarPost();
            mostrarToast('✅ Publicación actualizada', 'exito');
        } else {
            mostrarToast('❌ ' + (data.message || 'Error al actualizar'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('❌ Error al actualizar la publicación', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar Cambios';
    }
}

function abrirConfirmacionEliminarPost(e) {
    e.stopPropagation();
    const publicacionId = this.dataset.publicacionId;
    currentDeletingItem = {
        type: 'post',
        id: publicacionId
    };

    document.getElementById('confirmTitle').textContent = '¿Eliminar publicación?';
    document.getElementById('confirmMessage').textContent = 'Esta acción no se puede deshacer. ¿Estás seguro?';
    document.getElementById('modalConfirmacion').classList.add('active');
}

function cerrarModalConfirmacion() {
    document.getElementById('modalConfirmacion').classList.remove('active');
    currentDeletingItem = null;
}

async function ejecutarEliminar() {
    if (!currentDeletingItem) return;

    const btn = document.getElementById('confirmarAccion');
    btn.disabled = true;
    btn.textContent = 'Eliminando...';

    try {
        let endpoint = '';
        let body = {};

        if (currentDeletingItem.type === 'post') {
            endpoint = '/Sharee/api/publicaciones/delete_post.php';
            body = { publicacion_id: currentDeletingItem.id };
        } else if (currentDeletingItem.type === 'comment') {
            endpoint = '/Sharee/api/comentarios/delete_comment.php';
            body = { comentario_id: currentDeletingItem.id };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.success) {
            if (currentDeletingItem.type === 'post') {
                const card = document.querySelector(`.post-card[data-post-id="${currentDeletingItem.id}"]`);
                if (card) {
                    card.style.animation = 'slideOut 0.3s ease forwards';
                    setTimeout(() => {
                        card.remove();
                        const feed = document.getElementById('feed');
                        if (feed.children.length === 0) {
                            feed.innerHTML = `<div class="empty-state">Todavía no hay publicaciones. ¡Sé el primero en compartir!</div>`;
                        }
                    }, 300);
                }
            } else if (currentDeletingItem.type === 'comment') {
                const commentItem = document.querySelector(`.comment-item[data-comment-id="${currentDeletingItem.id}"]`);
                if (commentItem) {
                    const publicacionId = commentItem.closest('.comments-container').dataset.commentsFor;
                    commentItem.style.animation = 'slideOut 0.3s ease forwards';
                    setTimeout(() => {
                        commentItem.remove();
                        const card = document.querySelector(`.post-card[data-post-id="${publicacionId}"]`);
                        if (card) {
                            const countEl = card.querySelector('.comment-count');
                            const current = parseInt(countEl.textContent, 10) || 0;
                            if (current > 0) {
                                countEl.textContent = `${current - 1} comentarios`;
                            }
                        }
                        const commentsList = document.querySelector(`.comments-container[data-comments-for="${publicacionId}"] .comments-list`);
                        if (commentsList && commentsList.children.length === 0) {
                            commentsList.innerHTML = '<p class="empty-comments">Aún no hay comentarios.</p>';
                        }
                    }, 300);
                }
            }

            cerrarModalConfirmacion();
            mostrarToast('✅ Elemento eliminado', 'exito');
        } else {
            mostrarToast('❌ ' + (data.message || 'Error al eliminar'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('❌ Error al eliminar el elemento', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Eliminar';
    }
}

function activarClicksUsuarios() {
    document.querySelectorAll('.user-link, .post-avatar, .comment-avatar, .suggestion-avatar').forEach(elemento => {
        elemento.addEventListener('click', function (event) {
            event.stopPropagation();
            const usuarioId = this.dataset.userId;
            if (usuarioId) {
                window.location.href = `/Sharee/perfil.html?id=${encodeURIComponent(usuarioId)}`;
            }
        });
    });
}

function activarEventosLikes() {
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', async function () {
            const publicacionId = this.dataset.publicacionId;

            try {
                const response = await fetch('/Sharee/api/likes/toggle_like.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ publicacion_id: publicacionId })
                });

                const data = await response.json();

                if (!data.success) {
                    mostrarToast('❌ Error al procesar like', 'error');
                    return;
                }

                const card = this.closest('.post-card');
                const likeCount = card.querySelector('.like-count');
                likeCount.textContent = `${data.likes_count} likes`;

                if (data.liked) {
                    this.textContent = '❤️ Te gusta';
                    this.classList.add('active');
                } else {
                    this.textContent = '🤍 Me gusta';
                    this.classList.remove('active');
                }
            } catch (error) {
                console.error('Error al manejar like:', error);
                mostrarToast('❌ Error al procesar like', 'error');
            }
        });
    });
}

function activarEventosComentarios() {
    document.querySelectorAll('.toggle-comments').forEach(button => {
        button.addEventListener('click', async function () {
            const publicacionId = this.dataset.publicacionId;
            const container = document.querySelector(`.comments-container[data-comments-for="${publicacionId}"]`);

            if (!container) return;

            const isVisible = container.style.display !== 'none';

            if (isVisible) {
                container.style.display = 'none';
                return;
            }

            container.style.display = 'block';
            await cargarComentarios(publicacionId);
        });
    });

    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            const publicacionId = this.dataset.publicacionId;
            const input = this.querySelector('.comment-input');
            const contenido = input.value.trim();

            if (!contenido) {
                mostrarToast('Escribí algo para comentar', 'error');
                return;
            }

            const btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;

            try {
                const response = await fetch('/Sharee/api/comentarios/create_comment.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ publicacion_id: publicacionId, contenido })
                });

                const data = await response.json();

                if (data.success) {
                    input.value = '';
                    await cargarComentarios(publicacionId);
                    actualizarConteoComentarios(publicacionId);
                    mostrarToast('✅ Comentario agregado', 'exito');
                } else {
                    mostrarToast('❌ ' + (data.message || 'Error al comentar'), 'error');
                }
            } catch (error) {
                console.error('Error creando comentario:', error);
                mostrarToast('❌ Error al crear comentario', 'error');
            } finally {
                btn.disabled = false;
            }
        });
    });
}

async function cargarComentarios(publicacionId) {
    try {
        const response = await fetch(`/Sharee/api/comentarios/get_comments.php?publicacion_id=${publicacionId}`);
        const data = await response.json();

        if (!data.success) {
            console.error(data.message);
            return;
        }

        const container = document.querySelector(`.comments-container[data-comments-for="${publicacionId}"]`);
        const list = container.querySelector('.comments-list');

        if (!list) return;

        if (!data.data || data.data.length === 0) {
            list.innerHTML = '<p class="empty-comments">Aún no hay comentarios.</p>';
            return;
        }

        list.innerHTML = data.data.map(comment => {
            const botonesEdicion = comment.is_owner ? `
                <div class="comment-actions">
                    <button type="button" class="comment-edit-btn" data-comentario-id="${comment.id}" title="Editar">
                        ✏️
                    </button>
                    <button type="button" class="comment-delete-btn" data-comentario-id="${comment.id}" title="Eliminar">
                        🗑️
                    </button>
                </div>
            ` : '';

            return `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-user">
                        <div class="comment-avatar" data-user-id="${comment.usuario_id}">
                            ${crearAvatarHTML(comment, 'avatar-xs')}
                        </div>
                        <div class="comment-user-info">
                            <strong class="user-link" data-user-id="${comment.usuario_id}">
                                @${escaparHtml(comment.username)}
                            </strong>
                            <small>${formatearFecha(comment.created_at)}</small>
                        </div>
                    </div>
                    <p>${escaparHtml(comment.contenido)}</p>
                    ${botonesEdicion}
                </div>
            `;
        }).join('');

        activarClicksUsuarios();
        activarEventosEdicionComentarios();
    } catch (error) {
        console.error('Error cargando comentarios:', error);
    }
}

function activarEventosEdicionComentarios() {
    document.querySelectorAll('.comment-edit-btn').forEach(btn => {
        btn.addEventListener('click', abrirModalEditarComentario);
    });

    document.querySelectorAll('.comment-delete-btn').forEach(btn => {
        btn.addEventListener('click', abrirConfirmacionEliminarComentario);
    });
}

function abrirModalEditarComentario(e) {
    e.stopPropagation();
    const comentarioId = this.dataset.comentarioId;
    const comentarioItem = document.querySelector(`.comment-item[data-comment-id="${comentarioId}"]`);
    const contenido = comentarioItem.querySelector('p').textContent;

    currentEditingCommentId = comentarioId;
    document.getElementById('editCommentContent').value = contenido;
    document.getElementById('editCommentContent').focus();
    actualizarContadorComentario();
    document.getElementById('modalEditarComentario').classList.add('active');
}

function cerrarModalEditarComentario() {
    document.getElementById('modalEditarComentario').classList.remove('active');
    currentEditingCommentId = null;
    document.getElementById('formEditarComentario').reset();
}

function actualizarContadorComentario() {
    const textarea = document.getElementById('editCommentContent');
    const contador = document.getElementById('charCountComment');
    const count = textarea.value.length;
    contador.textContent = count;
    contador.parentElement.classList.remove('warning', 'danger');
    if (count > 450) contador.parentElement.classList.add('danger');
    else if (count > 400) contador.parentElement.classList.add('warning');
}

async function guardarEditComentario(e) {
    e.preventDefault();

    if (!currentEditingCommentId) return;

    const contenido = document.getElementById('editCommentContent').value.trim();

    if (!contenido) {
        mostrarToast('El comentario no puede estar vacío', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        const response = await fetch('/Sharee/api/comentarios/update_comment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comentario_id: currentEditingCommentId, contenido })
        });

        const data = await response.json();

        if (data.success) {
            const comentarioItem = document.querySelector(`.comment-item[data-comment-id="${currentEditingCommentId}"]`);
            if (comentarioItem) {
                const p = comentarioItem.querySelector('p');
                p.textContent = contenido;
                p.style.animation = 'none';
                setTimeout(() => {
                    p.style.animation = 'fadeIn 0.3s ease';
                }, 10);
            }

            cerrarModalEditarComentario();
            mostrarToast('✅ Comentario actualizado', 'exito');
        } else {
            mostrarToast('❌ ' + (data.message || 'Error al actualizar'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('❌ Error al actualizar el comentario', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar Cambios';
    }
}

function abrirConfirmacionEliminarComentario(e) {
    e.stopPropagation();
    const comentarioId = this.dataset.comentarioId;
    currentDeletingItem = {
        type: 'comment',
        id: comentarioId
    };

    document.getElementById('confirmTitle').textContent = '¿Eliminar comentario?';
    document.getElementById('confirmMessage').textContent = 'Esta acción no se puede deshacer. ¿Estás seguro?';
    document.getElementById('modalConfirmacion').classList.add('active');
}

function actualizarConteoComentarios(publicacionId) {
    const card = document.querySelector(`.post-card[data-post-id="${publicacionId}"]`);
    if (!card) return;

    const countEl = card.querySelector('.comment-count');
    const current = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = `${current + 1} comentarios`;
}

function formatearFecha(fecha) {
    if (!fecha) return 'Ahora';

    const date = new Date(fecha);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffMin < 1440) return `Hace ${Math.floor(diffMin / 60)} hs`;

    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short'
    });
}

function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.getElementById('toastNotification');
    toast.textContent = mensaje;
    toast.className = `toast-notification show ${tipo}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

async function cargarNombreUsuario() {
    const nombreElemento = document.getElementById('usuarioActual');

    if (!nombreElemento) return;

    try {
        const response = await fetch('/Sharee/api/usuarios/get_profile.php');
        const data = await response.json();

        if (!data.success || !data.data) return;

        const usuario = data.data;

        nombreElemento.textContent = usuario.username || 'Usuario';

        const avatarUsuarioActual = document.getElementById('avatarUsuarioActual');
        const avatarCompositor = document.getElementById('avatarCompositor');

        actualizarAvatarElemento(avatarUsuarioActual, usuario, 'avatar-sm');
        actualizarAvatarElemento(avatarCompositor, usuario, 'avatar-md');

        sessionStorage.setItem('userId', usuario.id);
    } catch (error) {
        console.error('Error cargando usuario actual:', error);
    }
}

async function cargarSugerencias() {
    const list = document.getElementById('suggestionsList');

    if (!list) return;

    try {
        const response = await fetch('/Sharee/api/usuarios/get_suggestions.php');
        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            list.innerHTML = '<li style="text-align: center; color: var(--color-texto-secundario); padding: 1rem;">No hay sugerencias disponibles.</li>';
            return;
        }

        list.innerHTML = data.data.map(usuario => `
            <li>
                <div class="user-row">
                    <div class="suggestion-avatar" data-user-id="${usuario.id}">
                        ${crearAvatarHTML(usuario, 'avatar-sm')}
                    </div>
                    <div>
                        <strong class="user-link" data-user-id="${usuario.id}">
                            ${escaparHtml(usuario.nombre)} ${escaparHtml(usuario.apellido)}
                        </strong>
                        <small>@${escaparHtml(usuario.username)}</small>
                    </div>
                </div>
                <button type="button" class="secondary-button btn-follow" data-user-id="${usuario.id}">
                    Seguir
                </button>
            </li>
        `).join('');

        document.querySelectorAll('.btn-follow').forEach(button => {
            button.addEventListener('click', async function (event) {
                event.preventDefault();
                event.stopPropagation();
                const userId = this.dataset.userId;
                await seguirUsuario(userId, this);
            });
        });

        activarClicksUsuarios();
    } catch (error) {
        console.error('Error cargando sugerencias:', error);
        mostrarToast('❌ Error al cargar sugerencias', 'error');
    }
}

async function seguirUsuario(usuarioId, button) {
    button.disabled = true;
    button.textContent = 'Siguiendo...';

    try {
        const response = await fetch('/Sharee/api/seguidores/follow.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seguido_id: usuarioId })
        });

        const data = await response.json();

        if (data.success) {
            button.textContent = 'Siguiendo';
            button.disabled = true;
            mostrarToast('✅ Usuario seguido', 'exito');
            await cargarSugerencias();
        } else {
            button.disabled = false;
            button.textContent = 'Seguir';
            mostrarToast('❌ ' + (data.message || 'No se pudo seguir'), 'error');
        }
    } catch (error) {
        console.error('Error siguiendo usuario:', error);
        button.disabled = false;
        button.textContent = 'Seguir';
        mostrarToast('❌ Error al seguir usuario', 'error');
    }
}

function escaparHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, char => map[char]);
}