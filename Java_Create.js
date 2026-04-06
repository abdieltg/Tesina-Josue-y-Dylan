import { getAuth, createUserWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { app } from "./Firebase.js";

const auth = getAuth(app);

document.getElementById("registroForm").addEventListener("submit", function(e){

  e.preventDefault();

  let usuario = document.getElementById("usuario").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let confirmPassword = document.getElementById("confirmPassword").value;

  if(!email.endsWith("@escuelasproa.edu.ar")){
    alert("Solo estudiantes PROA pueden registrarse");
    return;
  }

  if(password !== confirmPassword){
    alert("Las contraseñas no coinciden");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)

  .then(()=>{
      alert("Cuenta creada correctamente");
      window.location.href="Pagina_Login.html";
  })

  .catch((error)=>{
      alert(error.message);
  });

});