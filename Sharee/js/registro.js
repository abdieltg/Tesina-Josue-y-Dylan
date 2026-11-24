'use strict';

(() => {
    const CLAVE_VERIFICACION = 'shareeRegistroVerificacion';
    const VERSION_TERMINOS = '1.0';

    let emailPendiente = '';
    let expiraEn = 0;
    let temporizadorId = null;
    let enviando = false;
    let reenviando = false;

    document.addEventListener('DOMContentLoaded', inicializar);

    function inicializar() {
        const formulario = document.getElementById('formularioRegistro');
        const botonVerificar = document.getElementById('botonVerificar');
        const botonReenviar = document.getElementById('botonReenviar');
        const inputCodigo = document.getElementById('codigo');

        if (!formulario || !botonVerificar || !botonReenviar || !inputCodigo) {
            console.error('Registro: faltan elementos requeridos en registro.html.');
            return;
        }

        formulario.addEventListener('submit', manejarRegistro);
        botonVerificar.addEventListener('click', manejarVerificacion);
        botonReenviar.addEventListener('click', reenviarCodigo);

        document.getElementById('abrirTerminos')?.addEventListener('click', abrirTerminos);
        document.getElementById('cerrarTerminos')?.addEventListener('click', cerrarTerminos);
        document.getElementById('aceptarTerminos')?.addEventListener('click', aceptarTerminos);
        document.getElementById('botonVolver')?.addEventListener('click', volverAlRegistro);

        document.getElementById('aceptaTerminos')?.addEventListener('change', limpiarErrorTerminos);

        document.querySelectorAll('#camposRegistro input').forEach(input => {
            input.addEventListener('input', () => limpiarErrorInput(input.id));
        });

        inputCodigo.addEventListener('input', () => {
            inputCodigo.value = inputCodigo.value.replace(/\D/g, '').slice(0, 6);
            mostrarMensaje('mensajeCodigo', '');
        });

        inputCodigo.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                manejarVerificacion();
            }
        });

        restaurarVerificacion();
    }

    function abrirTerminos() {
        document.getElementById('dialogoTerminos')?.showModal();
    }

    function cerrarTerminos() {
        document.getElementById('dialogoTerminos')?.close();
    }

    function aceptarTerminos() {
        const checkbox = document.getElementById('aceptaTerminos');

        if (checkbox) checkbox.checked = true;

        limpiarErrorTerminos();
        cerrarTerminos();
    }

    function limpiarErrorTerminos() {
        const error = document.getElementById('error-terminos');

        if (error) {
            error.textContent = '';
            error.classList.remove('visible');
        }
    }

    async function solicitarJson(url, payload) {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const texto = await response.text();

        let data;
        try {
            data = JSON.parse(texto);
        } catch (error) {
            console.error('Respuesta no JSON del servidor:', {
                url,
                status: response.status,
                body: texto.slice(0, 2500)
            });
            throw new Error(`El servidor respondió con HTTP ${response.status} y un formato inválido.`);
        }

        return { response, data };
    }

    async function manejarRegistro(event) {
        event.preventDefault();

        if (enviando) return;

        limpiarErroresFormulario();
        mostrarMensaje('mensajeGeneral', '');

        const checkbox = document.getElementById('aceptaTerminos');
        const errorTerminos = document.getElementById('error-terminos');

        if (!checkbox?.checked) {
            if (errorTerminos) {
                errorTerminos.textContent = 'Debes aceptar los términos y condiciones para crear una cuenta.';
                errorTerminos.classList.add('visible');
            }
            document.getElementById('abrirTerminos')?.focus();
            return;
        }

        const boton = document.getElementById('botonRegistro');
        const textoOriginal = boton.textContent;

        const datosRegistro = {
            nombre: valor('nombre'),
            apellido: valor('apellido'),
            username: valor('username'),
            email: valor('email').toLowerCase(),
            password: document.getElementById('password').value,
            passwordConfirm: document.getElementById('passwordConfirm').value,
            acepta_terminos: true,
            terminos_version: VERSION_TERMINOS
        };

        enviando = true;
        boton.disabled = true;
        boton.textContent = 'Enviando código…';

        try {
            const { data } = await solicitarJson(
                '/Sharee/api/auth/registro.php',
                datosRegistro
            );

            if (!data.success) {
                mostrarErrores(data.errors);
                mostrarMensaje(
                    'mensajeGeneral',
                    data.message || 'No se pudo iniciar el registro.',
                    'error'
                );
                return;
            }

            emailPendiente = data.email || datosRegistro.email;
            mostrarPanelVerificacion(data.expires_in || 300);
            mostrarMensaje(
                'mensajeCodigo',
                data.message || 'Te enviamos un código. Revisa tu correo.',
                'exito'
            );
            document.getElementById('codigo')?.focus();
        } catch (error) {
            console.error('Error iniciando registro:', error);
            mostrarMensaje(
                'mensajeGeneral',
                error.message || 'No se pudo iniciar el registro.',
                'error'
            );
        } finally {
            enviando = false;
            boton.disabled = false;
            boton.textContent = textoOriginal;
        }
    }

    async function manejarVerificacion() {
        if (enviando) return;

        const boton = document.getElementById('botonVerificar');
        const input = document.getElementById('codigo');
        const codigo = input.value.trim();

        if (!emailPendiente) {
            mostrarMensaje(
                'mensajeCodigo',
                'No encontramos el registro pendiente. Volvé a completar el registro.',
                'error'
            );
            return;
        }

        if (!/^\d{6}$/.test(codigo)) {
            mostrarMensaje('mensajeCodigo', 'Ingresa los seis dígitos del código.', 'error');
            input.focus();
            return;
        }

        const textoOriginal = boton.textContent;
        enviando = true;
        boton.disabled = true;
        boton.textContent = 'Verificando…';

        try {
            const { data } = await solicitarJson(
                '/Sharee/api/auth/verificar_codigo.php',
                { email: emailPendiente, codigo }
            );

            if (!data.success) {
                if (data.expired) {
                    expiraEn = Date.now();
                    actualizarContador();
                }

                mostrarMensaje(
                    'mensajeCodigo',
                    data.message || 'No se pudo verificar el código.',
                    'error'
                );
                return;
            }

            detenerTemporizador();
            sessionStorage.removeItem(CLAVE_VERIFICACION);
            mostrarMensaje(
                'mensajeCodigo',
                data.message || 'Cuenta creada correctamente.',
                'success'
            );

            window.setTimeout(() => {
                window.location.href = '/Sharee/login.html';
            }, 1800);
        } catch (error) {
            console.error('Error verificando código:', error);
            mostrarMensaje('mensajeCodigo', error.message, 'error');
        } finally {
            enviando = false;
            boton.disabled = false;
            boton.textContent = textoOriginal;
        }
    }

    async function reenviarCodigo() {
        const boton = document.getElementById('botonReenviar');

        if (!emailPendiente || reenviando || Date.now() < expiraEn) return;

        const textoOriginal = boton.textContent;
        reenviando = true;
        boton.disabled = true;
        boton.textContent = 'Reenviando…';

        try {
            const { data } = await solicitarJson(
                '/Sharee/api/auth/reenviar_codigo.php',
                { email: emailPendiente }
            );

            if (!data.success) {
                if (Number(data.retry_after) > 0) {
                    iniciarContador(Number(data.retry_after));
                }

                mostrarMensaje(
                    'mensajeCodigo',
                    data.message || 'No se pudo reenviar el código.',
                    'error'
                );
                return;
            }

            document.getElementById('codigo').value = '';
            iniciarContador(data.expires_in || 300);
            mostrarMensaje(
                'mensajeCodigo',
                data.message || 'Te enviamos un nuevo código.',
                'success'
            );
        } catch (error) {
            console.error('Error reenviando código:', error);
            mostrarMensaje('mensajeCodigo', error.message, 'error');
        } finally {
            reenviando = false;
            boton.textContent = textoOriginal;
            actualizarContador();
        }
    }

    function mostrarPanelVerificacion(segundos) {
        document.getElementById('correoVerificacion').textContent = emailPendiente;
        document.getElementById('camposRegistro').classList.add('oculto');
        document.getElementById('panelVerificacion').classList.remove('oculto');
        iniciarContador(segundos);
    }

    function iniciarContador(segundos) {
        const duracion = Math.max(0, Number(segundos) || 0);
        expiraEn = Date.now() + duracion * 1000;

        guardarEstado();
        detenerTemporizador();
        actualizarContador();

        if (duracion > 0) {
            temporizadorId = window.setInterval(actualizarContador, 1000);
        }
    }

    function actualizarContador() {
        const restante = Math.max(0, Math.ceil((expiraEn - Date.now()) / 1000));
        const mm = String(Math.floor(restante / 60)).padStart(2, '0');
        const ss = String(restante % 60).padStart(2, '0');

        const texto = document.getElementById('temporizador');
        if (texto) texto.textContent = `${mm}:${ss}`;

        const reenviar = document.getElementById('botonReenviar');
        if (reenviar && !reenviando) reenviar.disabled = restante > 0;

        if (restante === 0) detenerTemporizador();
    }

    function restaurarVerificacion() {
        try {
            const guardado = JSON.parse(
                sessionStorage.getItem(CLAVE_VERIFICACION) || 'null'
            );

            if (!guardado?.email || !guardado?.expiraEn) return;

            emailPendiente = guardado.email;
            expiraEn = Number(guardado.expiraEn);

            document.getElementById('correoVerificacion').textContent = emailPendiente;
            document.getElementById('camposRegistro').classList.add('oculto');
            document.getElementById('panelVerificacion').classList.remove('oculto');

            actualizarContador();

            if (Date.now() < expiraEn) {
                temporizadorId = window.setInterval(actualizarContador, 1000);
            }
        } catch (error) {
            console.error('No se pudo restaurar la verificación:', error);
            sessionStorage.removeItem(CLAVE_VERIFICACION);
        }
    }

    function guardarEstado() {
        if (!emailPendiente || !expiraEn) return;

        sessionStorage.setItem(
            CLAVE_VERIFICACION,
            JSON.stringify({ email: emailPendiente, expiraEn })
        );
    }

    function detenerTemporizador() {
        if (temporizadorId !== null) {
            window.clearInterval(temporizadorId);
            temporizadorId = null;
        }
    }

    function volverAlRegistro() {
        detenerTemporizador();
        sessionStorage.removeItem(CLAVE_VERIFICACION);
        emailPendiente = '';
        expiraEn = 0;

        document.getElementById('panelVerificacion').classList.add('oculto');
        document.getElementById('camposRegistro').classList.remove('oculto');
        mostrarMensaje('mensajeCodigo', '');
        mostrarMensaje('mensajeGeneral', '');
    }

    function valor(id) {
        return document.getElementById(id)?.value.trim() || '';
    }

    function mostrarErrores(errores) {
        if (!errores || typeof errores !== 'object') return;

        Object.entries(errores).forEach(([campo, mensaje]) => {
            document.getElementById(campo)?.classList.add('error');

            const error = document.getElementById(`error-${campo}`);
            if (error) {
                error.textContent = mensaje;
                error.classList.add('visible');
            }
        });
    }

    function limpiarErrorInput(id) {
        document.getElementById(id)?.classList.remove('error');

        const error = document.getElementById(`error-${id}`);
        if (error) {
            error.textContent = '';
            error.classList.remove('visible');
        }
    }

    function limpiarErroresFormulario() {
        document.querySelectorAll('#camposRegistro input').forEach(input => {
            limpiarErrorInput(input.id);
        });
    }

    function mostrarMensaje(id, texto, tipo = '') {
        const elemento = document.getElementById(id);
        if (!elemento) return;

        elemento.textContent = texto;
        elemento.className = texto
            ? `mensaje-general ${tipo} visible`
            : 'mensaje-general';
    }
})();