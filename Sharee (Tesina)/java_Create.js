document
  .getElementById("registroForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    let usuario = document.getElementById("usuario").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    let mensaje = document.getElementById("mensajeRegistro");

    let usuarioData = {
      usuario: usuario,
      email: email,
      password: password,
    };

    localStorage.setItem("usuario", JSON.stringify(usuarioData));

    mensaje.textContent = "Cuenta creada correctamente";
    mensaje.className = "mensaje exito";

    setTimeout(function () {
      window.location.href = "Pagina_Login.html";
    }, 1500);
  });
