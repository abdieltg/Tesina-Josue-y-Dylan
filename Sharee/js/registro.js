'use strict';

(() => {
    const API = '/Sharee/api/auth/';
    const STORAGE_KEY = 'shareeRegistroVerificacion';

    let emailPendiente = '';
    let expiraEn = 0;
    let temporizadorId = null;
    let enviandoCodigo = false;
    let reenviandoCodigo = false;

    document.addEventListener('DOMContentLoaded', inicializar);

    function inicializar() {
        const formularioRegistro = document.getElementById('formularioRegistro');
        const botonVerificar = document.getElementById('botonVerificar');
        const botonReenviar = document.getElementById('botonReenviar');
        const botonVolver = document.getElementById('botonVolver');
        const inputCodigo = document.getElementById('codigo');

        if (!formularioRegistro || !botonVerificar || !botonReenviar || !inputCodigo) {
            console.error(
                'Registro Sharee: faltan elementos requeridos en registro.html. ' +
                'Confirma que guardaste el HTML corregido.'
            );
            return;
        }

        formularioRegistro.addEventListener('submit', manejarRegistro);
        botonVerificar.addEventListener('click', manejarVerificacion);
        botonReenviar.addEventListener('click', reenviarCodigo);
        botonVolver?.addEventListener('click', volverAlRegistro);

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

        document.querySelectorAll('#camposRegistro input').forEach(input => {
            input.addEventListener('input', () => limpiarErrorInput(input.id));
        });

        restaurarVerificacion();
    }

    async function solicitarJson(url, datos) {
        const respuesta = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const texto = await respuesta.text();

        let cuerpo;
        try {
            cuerpo = JSON.parse(texto);
        } catch (error) {
            console.error('El endpoint no devolvió JSON válido:', {
                url,
                status: respuesta.status,
                respuesta: texto.slice(0, 3000)
            });

            throw new Error(
                `El servidor respondió con HTTP ${respuesta.status}, pero no devolvió JSON válido.`
            );
        }

        return { respuesta, cuerpo };
    }

    async function manejarRegistro(event) {
        event.preventDefault();

        if (enviandoCodigo) return;

        limpiarErroresFormulario();
        mostrarMensaje('mensajeGeneral', '');

        const boton = document.getElementById('botonRegistro');

        if (!boton) {
            mostrarMensaje(
                'mensajeGeneral',
                'No se encuentra el botón de registro en la página.',
                'error'
            );
            return;
        }

        const textoOriginal = boton.textContent;

        const datosRegistro = {
            nombre: valor('nombre'),
            apellido: valor('apellido'),
            username: valor('username'),
            email: valor('email').toLowerCase(),
            password: document.getElementById('password')?.value ?? '',
            passwordConfirm: document.getElementById('passwordConfirm')?.value ?? ''
        };

        enviandoCodigo = true;
        boton.disabled = true;
        boton.textContent = 'Enviando código...';

        try {
            const { cuerpo } = await solicitarJson(
                `${API}registro.php`,
                datosRegistro
            );

            if (!cuerpo.success) {
                mostrarErrores(cuerpo.errors);
                mostrarMensaje(
                    'mensajeGeneral',
                    cuerpo.message || 'No se pudo iniciar el registro.',
                    'error'
                );
                return;
            }

            const email = String(cuerpo.email || datosRegistro.email).trim();

            if (!email) {
                throw new Error(
                    'El servidor aceptó el registro, pero no devolvió el correo para verificar.'
                );
            }

            emailPendiente = email;
            mostrarPanelVerificacion(cuerpo.expires_in || 300);

            mostrarMensaje(
                'mensajeCodigo',
                cuerpo.message || 'Te enviamos un código. Revisa tu correo.',
                'exito'
            );

            document.getElementById('codigo')?.focus();
        } catch (error) {
            console.error('Error iniciando registro:', error);
            mostrarMensaje(
                'mensajeGeneral',
                error.message || 'No se pudo completar el registro. Intenta nuevamente.',
                'error'
            );
        } finally {
            enviandoCodigo = false;
            boton.disabled = false;
            boton.textContent = textoOriginal;
        }
    }

    async function manejarVerificacion() {
        if (enviandoCodigo) return;

        const boton = document.getElementById('botonVerificar');
        const inputCodigo = document.getElementById('codigo');

        if (!boton || !inputCodigo) {
            console.error('Registro Sharee: falta el botón o el campo de código.');
            return;
        }

        if (!emailPendiente) {
            mostrarMensaje(
                'mensajeCodigo',
                'No encontramos el registro pendiente. Vuelve a completar el registro.',
                'error'
            );
            return;
        }

        const codigo = inputCodigo.value.trim();

        if (!/^\d{6}$/.test(codigo)) {
            mostrarMensaje(
                'mensajeCodigo',
                'Escribe los seis números que recibiste por correo.',
                'error'
            );
            inputCodigo.focus();
            return;
        }

        const textoOriginal = boton.textContent;
        enviandoCodigo = true;
        boton.disabled = true;
        boton.textContent = 'Verificando...';

        try {
            const { cuerpo } = await solicitarJson(
                `${API}verificar_codigo.php`,
                { email: emailPendiente, codigo }
            );

            if (!cuerpo.success) {
                if (cuerpo.expired) {
                    expiraEn = Date.now();
                    actualizarContador();
                }

                mostrarMensaje(
                    'mensajeCodigo',
                    cuerpo.message || 'No se pudo verificar el código.',
                    'error'
                );
                return;
            }

            detenerTemporizador();
            sessionStorage.removeItem(STORAGE_KEY);

            mostrarMensaje(
                'mensajeCodigo',
                cuerpo.message || 'Correo verificado. Tu cuenta ya fue creada.',
                'exito'
            );

            boton.textContent = 'Verificado';

            window.setTimeout(() => {
                window.location.href = '/Sharee/login.html';
            }, 1500);
        } catch (error) {
            console.error('Error verificando el código:', error);
            mostrarMensaje(
                'mensajeCodigo',
                error.message || 'No se pudo verificar el código. Intenta nuevamente.',
                'error'
            );
        } finally {
            enviandoCodigo = false;

            if (document.body.contains(boton) && boton.textContent !== 'Verificado') {
                boton.disabled = false;
                boton.textContent = textoOriginal;
            }
        }
    }

    async function reenviarCodigo() {
        const boton = document.getElementById('botonReenviar');

        if (!boton || reenviandoCodigo || !emailPendiente) return;
        if (Date.now() < expiraEn) return;

        const textoOriginal = boton.textContent;
        reenviandoCodigo = true;
        boton.disabled = true;
        boton.textContent = 'Reenviando...';

        try {
            const { cuerpo } = await solicitarJson(
                `${API}reenviar_codigo.php`,
                { email: emailPendiente }
            );

            if (!cuerpo.success) {
                if (Number(cuerpo.retry_after) > 0) {
                    iniciarContador(Number(cuerpo.retry_after));
                }

                mostrarMensaje(
                    'mensajeCodigo',
                    cuerpo.message || 'No se pudo reenviar el código.',
                    'error'
                );
                return;
            }

            document.getElementById('codigo').value = '';
            iniciarContador(cuerpo.expires_in || 300);

            mostrarMensaje(
                'mensajeCodigo',
                cuerpo.message || 'Te enviamos un nuevo código.',
                'exito'
            );
        } catch (error) {
            console.error('Error reenviando el código:', error);
            mostrarMensaje(
                'mensajeCodigo',
                error.message || 'No se pudo reenviar el código.',
                'error'
            );
        } finally {
            reenviandoCodigo = false;
            boton.textContent = textoOriginal;
            actualizarContador();
        }
    }

    function mostrarPanelVerificacion(segundos) {
        const campos = document.getElementById('camposRegistro');
        const panel = document.getElementById('panelVerificacion');
        const correo = document.getElementById('correoVerificacion');

        if (!campos || !panel || !correo) {
            throw new Error(
                'Falta un elemento del panel de verificación. ' +
                'Reemplaza registro.html y recarga la página con Ctrl + F5.'
            );
        }

        correo.textContent = emailPendiente;
        campos.classList.add('oculto');
        panel.classList.remove('oculto');

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
        const elemento = document.getElementById('temporizador');
        const botonReenviar = document.getElementById('botonReenviar');

        if (!expiraEn) {
            if (elemento) elemento.textContent = '05:00';
            if (botonReenviar) botonReenviar.disabled = true;
            return;
        }

        const restantes = Math.max(0, Math.ceil((expiraEn - Date.now()) / 1000));
        const minutos = String(Math.floor(restantes / 60)).padStart(2, '0');
        const segundos = String(restantes % 60).padStart(2, '0');

        if (elemento) {
            elemento.textContent = `${minutos}:${segundos}`;
        }

        if (botonReenviar && !reenviandoCodigo) {
            botonReenviar.disabled = restantes > 0;
        }

        if (restantes === 0) {
            detenerTemporizador();
        }
    }

    function restaurarVerificacion() {
        let estado;

        try {
            estado = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
        } catch {
            sessionStorage.removeItem(STORAGE_KEY);
            return;
        }

        if (!estado || !estado.email || !Number(estado.expiraEn)) return;

        emailPendiente = String(estado.email);
        expiraEn = Number(estado.expiraEn);

        const campos = document.getElementById('camposRegistro');
        const panel = document.getElementById('panelVerificacion');
        const correo = document.getElementById('correoVerificacion');

        if (!campos || !panel || !correo) {
            console.error('No se puede restaurar el panel: revisa registro.html.');
            return;
        }

        correo.textContent = emailPendiente;
        campos.classList.add('oculto');
        panel.classList.remove('oculto');

        actualizarContador();

        if (Date.now() < expiraEn) {
            temporizadorId = window.setInterval(actualizarContador, 1000);
        }
    }

    function guardarEstado() {
        if (!emailPendiente || !expiraEn) return;

        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ email: emailPendiente, expiraEn })
        );
    }

    function volverAlRegistro() {
        detenerTemporizador();
        sessionStorage.removeItem(STORAGE_KEY);

        emailPendiente = '';
        expiraEn = 0;

        document.getElementById('panelVerificacion')?.classList.add('oculto');
        document.getElementById('camposRegistro')?.classList.remove('oculto');

        mostrarMensaje('mensajeCodigo', '');
        mostrarMensaje('mensajeGeneral', '');
    }

    function detenerTemporizador() {
        if (temporizadorId !== null) {
            window.clearInterval(temporizadorId);
            temporizadorId = null;
        }
    }

    function valor(id) {
        return document.getElementById(id)?.value.trim() ?? '';
    }

    function mostrarErrores(errores) {
        if (!errores || typeof errores !== 'object') return;

        Object.entries(errores).forEach(([campo, mensaje]) => {
            const input = document.getElementById(campo);
            const error = document.getElementById(`error-${campo}`);

            input?.classList.add('error');

            if (error) {
                error.textContent = String(mensaje);
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
        if (!elemento) {
            console.error(`No existe el elemento #${id} en registro.html.`);
            return;
        }

        elemento.textContent = texto;
        elemento.className = texto
            ? `mensaje-general ${tipo} visible`
            : 'mensaje-general';
    }
})();