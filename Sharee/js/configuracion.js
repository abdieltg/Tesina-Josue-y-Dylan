document.addEventListener('DOMContentLoaded', function () {
    cargarDatosPerfil();

    document
        .getElementById('formPerfil')
        .addEventListener('submit', guardarPerfil);

    document
        .getElementById('formAvatar')
        .addEventListener('submit', subirAvatar);

    document
        .getElementById('formPassword')
        .addEventListener('submit', cambiarPassword);

    configurarDragDropAvatar();
});

function configurarDragDropAvatar() {
    const fileInput = document.getElementById('avatar');
    const label = document.querySelector('.file-input-label');

    if (!label) {
        return;
    }

    label.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        label.classList.add('dragover');
    });

    label.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        label.classList.remove('dragover');
    });

    label.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        label.classList.remove('dragover');

        const archivos = e.dataTransfer.files;

        if (archivos.length > 0) {
            fileInput.files = archivos;
            mostrarArchivoSeleccionado(archivos[0]);
        }
    });

    fileInput.addEventListener('change', function () {
        if (this.files.length > 0) {
            mostrarArchivoSeleccionado(this.files[0]);
        }
    });
}

function mostrarArchivoSeleccionado(archivo) {
    const info = document.querySelector('.file-selected-info');

    if (!info) {
        return;
    }

    const sizeMB = (archivo.size / (1024 * 1024)).toFixed(2);

    info.innerHTML = `
        <strong>✓ Archivo seleccionado:</strong><br>
        ${archivo.name} (${sizeMB} MB)
    `;

    info.classList.add('show');
}

async function cargarDatosPerfil() {
    try {
        const response = await fetch('/Sharee/api/usuarios/get_profile.php');
        const data = await response.json();

        if (!data.success) {
            mostrarMensaje('mensajePerfil', data.message, 'error');
            return;
        }

        const usuario = data.data;

        document.getElementById('nombre').value = usuario.nombre || '';
        document.getElementById('apellido').value = usuario.apellido || '';
        document.getElementById('username').value = usuario.username || '';
        document.getElementById('bio').value = usuario.bio || '';

        mostrarAvatar(usuario);
    } catch (error) {
        console.error('Error cargando configuración:', error);
        mostrarMensaje('mensajePerfil', 'No se pudo cargar la configuración.', 'error');
    }
}

async function guardarPerfil(event) {
    event.preventDefault();

    limpiarErrores();

    const boton = document.getElementById('btnGuardarPerfil');
    boton.disabled = true;
    boton.textContent = 'Guardando...';

    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        username: document.getElementById('username').value.trim(),
        bio: document.getElementById('bio').value.trim()
    };

    try {
        const response = await fetch('/Sharee/api/usuarios/update_profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (!data.success) {
            mostrarMensaje('mensajePerfil', data.message, 'error');

            if (data.errors) {
                Object.entries(data.errors).forEach(([campo, mensaje]) => {
                    const elemento = document.getElementById(`error-${campo}`);

                    if (elemento) {
                        elemento.textContent = mensaje;
                    }
                });
            }

            return;
        }

        mostrarMensaje('mensajePerfil', data.message, 'success');
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        mostrarMensaje('mensajePerfil', 'No se pudo actualizar el perfil.', 'error');
    } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar cambios';
    }
}

async function subirAvatar(event) {
    event.preventDefault();

    const archivo = document.getElementById('avatar').files[0];

    if (!archivo) {
        mostrarMensaje('mensajeAvatar', 'Seleccioná una imagen.', 'error');
        return;
    }

    const boton = document.getElementById('btnSubirAvatar');
    boton.disabled = true;
    boton.textContent = 'Subiendo...';

    const formulario = new FormData();
    formulario.append('avatar', archivo);

    try {
        const response = await fetch('/Sharee/api/usuarios/upload_avatar.php', {
            method: 'POST',
            body: formulario
        });

        const data = await response.json();

        if (!data.success) {
            mostrarMensaje('mensajeAvatar', data.message, 'error');
            return;
        }

        mostrarMensaje('mensajeAvatar', data.message, 'success');

        mostrarAvatar({
            username: document.getElementById('username').value,
            avatar_url: `${data.data.avatar_url}?t=${Date.now()}`
        });

        document.getElementById('avatar').value = '';
        const info = document.querySelector('.file-selected-info');
        if (info) {
            info.classList.remove('show');
        }
    } catch (error) {
        console.error('Error subiendo avatar:', error);
        mostrarMensaje('mensajeAvatar', 'No se pudo subir el avatar.', 'error');
    } finally {
        boton.disabled = false;
        boton.textContent = 'Subir avatar';
    }
}

async function cambiarPassword(event) {
    event.preventDefault();

    const boton = document.getElementById('btnCambiarPassword');
    boton.disabled = true;
    boton.textContent = 'Actualizando...';

    const datos = {
        password_actual: document.getElementById('passwordActual').value,
        password_nueva: document.getElementById('passwordNueva').value,
        password_confirmacion: document.getElementById('passwordConfirmacion').value
    };

    try {
        const response = await fetch('/Sharee/api/auth/change_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (!data.success) {
            mostrarMensaje('mensajePassword', data.message, 'error');
            return;
        }

        document.getElementById('formPassword').reset();
        mostrarMensaje('mensajePassword', data.message, 'success');
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        mostrarMensaje('mensajePassword', 'No se pudo cambiar la contraseña.', 'error');
    } finally {
        boton.disabled = false;
        boton.textContent = 'Cambiar contraseña';
    }
}

function mostrarAvatar(usuario) {
    const preview = document.getElementById('avatarPreview');

    if (!preview) {
        return;
    }

    if (usuario.avatar_url) {
        const imagen = document.createElement('img');
        imagen.src = `/Sharee/${usuario.avatar_url}`;
        imagen.alt = 'Avatar actual';
        preview.innerHTML = '';
        preview.appendChild(imagen);
        return;
    }

    preview.textContent = (usuario.username || 'U').charAt(0).toUpperCase();
}

function mostrarMensaje(id, mensaje, tipo) {
    const elemento = document.getElementById(id);

    if (!elemento) {
        return;
    }

    elemento.textContent = mensaje;
    elemento.className = `form-message ${tipo}`;
}

function limpiarErrores() {
    document.querySelectorAll('.field-error').forEach(elemento => {
        elemento.textContent = '';
    });
}