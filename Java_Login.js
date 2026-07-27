document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const mensajeLogin = document.getElementById("mensajeLogin");
  const btnLogin = document.getElementById("btnLogin");

  // Validación en tiempo real
  loginEmail.addEventListener("blur", function () {
    validarEmail(this.value);
  });

  loginPassword.addEventListener("blur", function () {
    validarPassword(this.value);
  });

  // Envío del formulario
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let email = loginEmail.value.trim();
    let password = loginPassword.value;

    // Validación básica
    if (!email || !password) {
      mostrarMensaje("Por favor completa todos los campos", "error");
      return;
    }

    if (!validarEmail(email)) {
      mostrarMensaje("Por favor ingresa un email válido", "error");
      return;
    }

    if (password.length < 6) {
      mostrarMensaje("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }

    // Desabilitar botón y mostrar carga
    btnLogin.disabled = true;
    mostrarMensaje("Iniciando sesión...", "cargando");
    btnLogin.innerHTML = '<span class="loading-spinner"></span>Iniciando sesión...';

    fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          mostrarMensaje(data.error, "error");
          btnLogin.disabled = false;
          btnLogin.innerHTML = "Iniciar sesión";
        } else {
          mostrarMensaje("¡Bienvenido! Redirigiendo...", "exito");

          localStorage.setItem("usuario_id", data.usuario_id);
          localStorage.setItem("username", data.username);
          localStorage.setItem("email", data.email);

          setTimeout(() => {
            window.location.href = "Pagina_Social.html";
          }, 1500);
        }
      })
      .catch(err => {
        console.error("Error:", err);
        mostrarMensaje("Error de conexión. Intenta nuevamente", "error");
        btnLogin.disabled = false;
        btnLogin.innerHTML = "Iniciar sesión";
      });
  });

  // Función para validar email
  function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Función para validar contraseña
  function validarPassword(password) {
    return password.length >= 6;
  }

  // Función para mostrar mensajes
  function mostrarMensaje(texto, tipo) {
    mensajeLogin.textContent = texto;
    mensajeLogin.className = `mensaje ${tipo}`;

    if (tipo !== "cargando") {
      setTimeout(() => {
        mensajeLogin.className = "mensaje";
      }, 5000);
    }
  }

  // Mostrar/Ocultar contraseña
  const togglePasswordBtn = document.getElementById("togglePassword");
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", function () {
      const type = loginPassword.getAttribute("type") === "password" ? "text" : "password";
      loginPassword.setAttribute("type", type);
      this.textContent = type === "password" ? "👁" : "👁‍🗨";
    });
  }

  // Permitir Enter en los campos
  loginEmail.addEventListener("keypress", function (e) {
    if (e.key === "Enter") loginForm.dispatchEvent(new Event("submit"));
  });

  loginPassword.addEventListener("keypress", function (e) {
    if (e.key === "Enter") loginForm.dispatchEvent(new Event("submit"));
  });
});
