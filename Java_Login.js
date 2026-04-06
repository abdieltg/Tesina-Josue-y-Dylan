document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  let usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));

  let usuario = document.getElementById("loginUsuario").value;
  let password = document.getElementById("loginPassword").value;

  let mensaje = document.getElementById("mensajeLogin");

  if (
    usuarioGuardado &&
    usuario === usuarioGuardado.usuario &&
    password === usuarioGuardado.password
  ) {
    mensaje.textContent = "Inicio de sesión exitoso";
    mensaje.className = "mensaje exito";
    setTimeout(function () {
      window.location.href = "Pagina_Social.html";
    }, 1500);
  } else {
    mensaje.textContent = "Usuario o contraseña incorrectos";
    mensaje.className = "mensaje error";
  }
});
