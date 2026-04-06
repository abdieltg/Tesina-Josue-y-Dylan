import { getAuth, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { app } from "./Firebase.js";

const auth = getAuth(app);

document.getElementById("loginForm").addEventListener("submit", function (e) {

  e.preventDefault();

  let email = document.getElementById("loginEmail").value;
  let password = document.getElementById("loginPassword").value;

  let mensaje = document.getElementById("mensajeLogin");

  signInWithEmailAndPassword(auth, email, password)

  .then(() => {
      mensaje.textContent = "Inicio de sesión exitoso";
      mensaje.className = "mensaje exito";

      setTimeout(function () {
        window.location.href = "Pagina_Social.html";
      }, 1500);
  })

  .catch(() => {
      mensaje.textContent = "Correo o contraseña incorrectos";
      mensaje.className = "mensaje error";
  });

});