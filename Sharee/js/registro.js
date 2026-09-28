// Gestión del registro de usuarios

document.addEventListener('DOMContentLoaded', function () {
    const formulario = document.getElementById('formularioRegistro');
    
    if (formulario) {
        formulario.addEventListener('submit', manejarRegistro);
    }

    // Limpiar errores cuando el usuario escribe
    const inputs = document.querySelectorAll('.grupo-formulario input');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            limpiarErrorInput(this.id);
        });
    });
});

async function manejarRegistro(event) {
    event.preventDefault();

    // Obtener datos del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    // Limpiar errores previos
    limpiarErroresFormulario();

    // Botón de envío
    const boton = document.querySelector('.boton-registro');
    const textoOriginal = boton.textContent;

    try {
        // Mostrar estado de carga
        boton.disabled = true;
        boton.innerHTML = '<span class="cargando"></span>Registrando...';

        // Enviar solicitud al servidor
        const respuesta = await fetch('/Sharee/api/auth/registro.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                apellido,
                username,
                email,
                password,
                passwordConfirm
            })
        });

        const datos = await respuesta.json();

        if (datos.success) {
            // Mostrar mensaje de éxito
            mostrarMensajeGeneral(datos.message, 'exito');

            // Limpiar formulario
            document.getElementById('formularioRegistro').reset();

            // Redirigir a login después de 2 segundos
            setTimeout(() => {
                window.location.href = '/Sharee/login.html';
            }, 2000);
        } else {
            // Mostrar errores
            if (datos.errors && Object.keys(datos.errors).length > 0) {
                Object.keys(datos.errors).forEach(campo => {
                    mostrarErrorInput(campo, datos.errors[campo]);
                });
            }

            mostrarMensajeGeneral(datos.message, 'error');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        mostrarMensajeGeneral('Error al conectar con el servidor. Intenta nuevamente.', 'error');
    } finally {
        // Restaurar botón
        boton.disabled = false;
        boton.textContent = textoOriginal;
    }
}

function mostrarErrorInput(campo, mensaje) {
    const input = document.getElementById(campo);
    const errorSpan = document.getElementById(`error-${campo}`);

    if (input && errorSpan) {
        input.classList.add('error');
        errorSpan.textContent = mensaje;
        errorSpan.classList.add('visible');
    }
}

function limpiarErrorInput(id) {
    const input = document.getElementById(id);
    const errorSpan = document.getElementById(`error-${id}`);

    if (input && errorSpan) {
        input.classList.remove('error');
        errorSpan.textContent = '';
        errorSpan.classList.remove('visible');
    }
}

function limpiarErroresFormulario() {
    const inputs = document.querySelectorAll('.grupo-formulario input');
    inputs.forEach(input => {
        limpiarErrorInput(input.id);
    });
}

function mostrarMensajeGeneral(mensaje, tipo) {
    const div = document.getElementById('mensajeGeneral');

    if (div) {
        div.textContent = mensaje;
        div.className = `mensaje-general ${tipo} visible`;
    }
}