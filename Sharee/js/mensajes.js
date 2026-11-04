let usuarioActualId = null;
let usuarioActivoId = null;
let archivoSeleccionado = null;
let mensajeEnEdicionId = null;

document.addEventListener('DOMContentLoaded', async function () {
    await cargarUsuarioActual();

    const params = new URLSearchParams(window.location.search);
    const userIdFromUrl = params.get('user_id');

    if (userIdFromUrl) {
        usuarioActivoId = Number(userIdFromUrl);
    }

    const formMensaje = document.getElementById('formMensaje');
    const inputArchivo = document.getElementById('mensajeImagen');
    const previewImage = document.getElementById('previewImage');
    const removeBtn = document.getElementById('removeImageMessage');

    if (formMensaje) {
        formMensaje.addEventListener('submit', enviarMensaje);
    }

    if (inputArchivo) {
        inputArchivo.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;

            const allowed = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowed.includes(file.type)) {
                alert('Solo JPG, PNG o WEBP');
                this.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no puede superar 5 MB');
                this.value = '';
                return;
            }

            archivoSeleccionado = file;
            document.getElementById('mensajeArchivoNombre').textContent = file.name;

            const reader = new FileReader();
            reader.onload = function (event) {
                previewImage.src = event.target.result;
                document.getElementById('previewAdjunto').style.display = 'flex';
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            archivoSeleccionado = null;
            inputArchivo.value = '';
            document.getElementById('mensajeArchivoNombre').textContent = '';
            document.getElementById('previewAdjunto').style.display = 'none';
            previewImage.src = '';
        });
    }

    const formEditar = document.getElementById('formEditarMensaje');
    if (formEditar) {
        formEditar.addEventListener('submit', guardarMensajeEditado);
    }

    const cerrarModalBtn = document.getElementById('cerrarModalMensaje');
    const cancelarModalBtn = document.getElementById('cancelarEditMensaje');

    if (cerrarModalBtn) cerrarModalBtn.addEventListener('click', cerrarModalEdicion);
    if (cancelarModalBtn) cancelarModalBtn.addEventListener('click', cerrarModalEdicion);

    await cargarConversaciones();

    if (usuarioActivoId) {
        await seleccionarChat(usuarioActivoId);
    } else if (usuarioActualId) {
        const chatInput = document.getElementById('mensajeTexto');
        if (chatInput) {
            chatInput.addEventListener('input', function () {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 150) + 'px';
            });
        }
    }
});

async function cargarUsuarioActual() {
    try {
        const res = await fetch('/Sharee/api/usuarios/get_profile.php');
        const data = await res.json();

        if (!data.success || !data.data) {
            return;
        }

        usuarioActualId = data.data.id;

        const chatNombre = document.getElementById('chatNombre');
        if (chatNombre) {
            chatNombre.textContent = data.data.username || 'Usuario';
        }
    } catch (error) {
        console.error('Error cargando usuario actual:', error);
    }
}

async function cargarConversaciones() {
    const list = document.getElementById('listaConversaciones');

    if (!list) return;

    try {
        const response = await fetch('/Sharee/api/mensajes/get_conversations.php');
        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            list.innerHTML = '<div class="empty-state">Todavía no tenés conversaciones.</div>';
            return;
        }

        list.innerHTML = data.data.map(conversation => `
            <div class="conversation-item ${Number(usuarioActivoId) === Number(conversation.user_id) ? 'active' : ''}" data-user-id="${conversation.user_id}">
                <div class="conversation-avatar">
                    ${crearAvatarHTML(conversation, 'avatar-sm')}
                </div>
                <div class="conversation-user">
                    <div class="conversation-name">
                        <strong>${escapeHtml(conversation.nombre)} ${escapeHtml(conversation.apellido)}</strong>
                    </div>
                    <div class="conversation-preview">
                        ${conversation.last_message_from_me ? 'Tú: ' : ''}${escapeHtml(conversation.last_message || 'Mensaje')}
                    </div>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', function () {
                const userId = Number(this.dataset.userId);
                seleccionarChat(userId);
            });
        });

        if (!usuarioActivoId && data.data.length > 0) {
            seleccionarChat(Number(data.data[0].user_id));
        }
    } catch (error) {
        console.error('Error cargando conversaciones:', error);
        list.innerHTML = '<div class="empty-state">No se pudieron cargar los mensajes.</div>';
    }
}

async function seleccionarChat(userId) {
    usuarioActivoId = Number(userId);

    const chatNombre = document.getElementById('chatNombre');
    const chatEstado = document.getElementById('chatEstado');

    try {
        const res = await fetch(`/Sharee/api/usuarios/get_profile.php?usuario_id=${userId}`);
        const data = await res.json();

        if (data.success && data.data) {
            const usuario = data.data;
            const avatar = document.querySelector('#chatUserInfo .chat-avatar');

            if (avatar) {
                avatar.innerHTML = crearAvatarHTML(usuario, 'avatar-sm');
            }

            chatNombre.textContent = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.username;
            chatEstado.textContent = `@${usuario.username}`;
        }
    } catch (error) {
        console.error('Error cargando perfil del usuario activo:', error);
    }

    await cargarMensajes(userId);
    await cargarConversaciones();
}

async function cargarMensajes(userId) {
    const contenedor = document.getElementById('chatMessages');
    if (!contenedor) return;

    try {
        const response = await fetch(`/Sharee/api/mensajes/get_messages.php?usuario_id=${userId}`);
        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            contenedor.innerHTML = '<div class="empty-state">Todavía no hay mensajes. ¡Escribí el primero!</div>';
            return;
        }

        contenedor.innerHTML = data.data.map(mensaje => {
            const esMio = Number(mensaje.is_owner) === 1;
            const contenido = mensaje.contenido ? escapeHtml(mensaje.contenido) : '';
            const imagenHtml = mensaje.imagen_url
                ? `<img class="message-image" src="/Sharee/${mensaje.imagen_url}" alt="Imagen del mensaje">`
                : '';

            const accionEditar = esMio && Number(mensaje.can_edit) === 1
                ? `<button type="button" class="action-icon edit-message" data-id="${mensaje.id}">Editar</button>`
                : '';

            const accionBorrar = esMio
                ? `<button type="button" class="action-icon delete-message" data-id="${mensaje.id}">Eliminar</button>`
                : '';

            return `
                <div class="message-row ${esMio ? 'me' : ''}">
                    <div class="message-bubble">
                        ${imagenHtml}
                        ${contenido ? `<p>${contenido}</p>` : ''}
                        <div class="message-meta">
                            <span>${formatearHora(mensaje.created_at)}</span>
                        </div>
                        ${esMio ? `
                            <div class="message-actions">
                                ${accionEditar}
                                ${accionBorrar}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        contenedor.scrollTop = contenedor.scrollHeight;

        document.querySelectorAll('.edit-message').forEach(btn => {
            btn.addEventListener('click', function () {
                abrirModalEdicion(this.dataset.id);
            });
        });

        document.querySelectorAll('.delete-message').forEach(btn => {
            btn.addEventListener('click', async function () {
                const mensajeId = this.dataset.id;
                await eliminarMensaje(mensajeId);
            });
        });
    } catch (error) {
        console.error('Error cargando mensajes:', error);
        contenedor.innerHTML = '<div class="empty-state">No se pudieron cargar los mensajes.</div>';
    }
}

async function enviarMensaje(event) {
    event.preventDefault();

    if (!usuarioActivoId) {
        alert('Seleccioná una conversación');
        return;
    }

    const contenido = document.getElementById('mensajeTexto').value.trim();
    const formData = new FormData();

    formData.append('receptor_id', String(usuarioActivoId));
    formData.append('contenido', contenido);

    if (archivoSeleccionado) {
        formData.append('imagen', archivoSeleccionado);
    }

    if (!contenido && !archivoSeleccionado) {
        alert('Escribí un mensaje o adjuntá una imagen');
        return;
    }

    try {
        const response = await fetch('/Sharee/api/mensajes/send_message.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'No se pudo enviar el mensaje');
            return;
        }

        document.getElementById('mensajeTexto').value = '';
        document.getElementById('mensajeTexto').style.height = 'auto';

        archivoSeleccionado = null;
        document.getElementById('mensajeImagen').value = '';
        document.getElementById('mensajeArchivoNombre').textContent = '';
        document.getElementById('previewAdjunto').style.display = 'none';

        await cargarMensajes(usuarioActivoId);
        await cargarConversaciones();
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        alert('No se pudo enviar el mensaje');
    }
}

function abrirModalEdicion(mensajeId) {
    mensajeEnEdicionId = Number(mensajeId);

    const row = document.querySelector(`.message-row .edit-message[data-id="${mensajeId}"]`)?.closest('.message-row');
    if (!row) return;

    const texto = row.querySelector('p')?.textContent || '';
    document.getElementById('editMensajeTexto').value = texto;

    document.getElementById('modalEditarMensaje').classList.add('active');
}

function cerrarModalEdicion() {
    document.getElementById('modalEditarMensaje').classList.remove('active');
    mensajeEnEdicionId = null;
    document.getElementById('formEditarMensaje').reset();
}

async function guardarMensajeEditado(event) {
    event.preventDefault();

    if (!mensajeEnEdicionId) return;

    const contenido = document.getElementById('editMensajeTexto').value.trim();

    if (!contenido) {
        alert('El mensaje no puede quedar vacío');
        return;
    }

    const formData = new FormData();
    formData.append('mensaje_id', String(mensajeEnEdicionId));
    formData.append('contenido', contenido);

    try {
        const response = await fetch('/Sharee/api/mensajes/edit_message.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'No se pudo editar el mensaje');
            return;
        }

        cerrarModalEdicion();
        await cargarMensajes(usuarioActivoId);
        await cargarConversaciones();
    } catch (error) {
        console.error('Error editando mensaje:', error);
        alert('No se pudo editar el mensaje');
    }
}

async function eliminarMensaje(mensajeId) {
    if (!confirm('¿Querés eliminar este mensaje para todos?')) return;

    try {
        const response = await fetch('/Sharee/api/mensajes/delete_message.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje_id: mensajeId })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'No se pudo eliminar');
            return;
        }

        await cargarMensajes(usuarioActivoId);
        await cargarConversaciones();
    } catch (error) {
        console.error('Error eliminando mensaje:', error);
        alert('No se pudo eliminar el mensaje');
    }
}

function formatearHora(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
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

function crearAvatarHTML(usuario, clase = 'avatar-md') {
    const username = usuario?.username || 'usuario';
    const avatarUrl = usuario?.avatar_url;

    if (avatarUrl) {
        return `<img src="/Sharee/${avatarUrl}" alt="${escapeHtml(username)}" class="avatar-img ${clase}">`;
    }

    return `<div class="avatar ${clase}">${(username || 'U').charAt(0).toUpperCase()}</div>`;
}