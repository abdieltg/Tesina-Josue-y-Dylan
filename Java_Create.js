document.getElementById("registroForm").addEventListener("submit", function(e) {
  e.preventDefault();

  let usuario = document.getElementById("usuario").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let confirmPassword = document.getElementById("confirmPassword").value;

  if (!email.includes("@escuelasproa.edu.ar")) {
    alert("Solo estudiantes PROA pueden registrarse");
    return;
  }

  if (password !== confirmPassword) {
    alert("Las contraseñas no coinciden");
    return;
  }

  fetch("http://localhost/sharee/api/register.php", {
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
      alert(data.error);
    } else {
      alert(data.mensaje);
      window.location.href = "Pagina_Login.html";
    }
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Error de conexión");
  });
});