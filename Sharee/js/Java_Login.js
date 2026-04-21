document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  let email = document.getElementById("loginEmail").value;
  let password = document.getElementById("loginPassword").value;
  let mensaje = document.getElementById("mensajeLogin");

  fetch("http://localhost/sharee/api/login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      mensaje.textContent = data.error;
      mensaje.className = "mensaje error";
    } else {
      mensaje.textContent = "Inicio de sesión exitoso";
      mensaje.className = "mensaje exito";
      
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
    mensaje.textContent = "Error de conexión";
    mensaje.className = "mensaje error";
  });
});