document.getElementById("registroForm").addEventListener("submit", function(e) {
  e.preventDefault();

  let usuario = document.getElementById("usuario").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let confirmPassword = document.getElementById("confirmPassword").value;
  let mensaje = document.getElementById("mensajeRegistro");

  if (!email.includes("@escuelasproa.edu.ar")) {
    mensaje.textContent = "Solo estudiantes PROA pueden registrarse";
    mensaje.className = "mensaje error";
    return;
  }

  if (password !== confirmPassword) {
    mensaje.textContent = "Las contraseñas no coinciden";
    mensaje.className = "mensaje error";
    return;
  }

  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/register.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      username: usuario, 
      email, 
      password, 
      confirmPassword 
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      mensaje.textContent = data.error;
      mensaje.className = "mensaje error";
    } else {
      mensaje.textContent = "Cuenta creada correctamente";
      mensaje.className = "mensaje exito";
      setTimeout(() => {
        window.location.href = "Pagina_Login.html";
      }, 1500);
    }
  })
  .catch(err => {
    console.error("Error:", err);
    mensaje.textContent = "Error de conexión";
    mensaje.className = "mensaje error";
  });
});