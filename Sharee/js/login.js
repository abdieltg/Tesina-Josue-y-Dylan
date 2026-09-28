// Gestión del inicio de sesión

document.addEventListener('DOMContentLoaded', function () {
    const formulario = document.getElementById('formularioLogin');

    if (formulario) {
        formulario.addEventListener('submit', manejarLogin);
    }

    // Limpiar errores cuando el usuario escribe
    const inputs = document.querySelectorAll('.grupo-formulario input');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            limpiarErrorInput(this.id);
        });
    });
});

async function manejarLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Limpiar errores
    limpiarErroresFormulario();

    const boton = document.querySelector('.boton-login');
    const textoOriginal = boton.textContent;

    try {
        boton.disabled = true;
        boton.innerHTML = '<span class="cargando"></span>Iniciando sesión...';

        const respuesta = await fetch('/Sharee/api/auth/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const datos = await respuesta.json();

        if (datos.success) {
            mostrarMensajeGeneral(datos.message, 'exito');

            // Redirigir a inicio después de 1 segundo
            setTimeout(() => {
                window.location.href = '/Sharee/inicio.html';
            }, 1000);
        } else {
            mostrarMensajeGeneral(datos.message, 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        mostrarMensajeGeneral('Error al conectar con el servidor. Intenta nuevamente.', 'error');
    } finally {
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