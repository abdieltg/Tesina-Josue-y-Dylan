let usuario_id = localStorage.getItem("usuario_id");
let username = localStorage.getItem("username");

if (!usuario_id) {
  window.location.href = "Pagina_Login.html";
}

const inputFoto = document.getElementById("inputFoto");
const fotoPreview = document.getElementById("fotoPreview");
const formularioPerfil = document.getElementById("formularioPerfil");
const mensajeResultado = document.getElementById("mensajeResultado");
const bioTextarea = document.getElementById("bio");
const charCount = document.getElementById("charCount");

function cargarDatos() {
  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/get_profile.php?usuario_id=" + usuario_id)
    .then(res => res.json())
    .then(data => {
      document.getElementById("username").value = data.username;
      document.getElementById("email").value = data.email;
      
      cargarFotoPerfil();
    })
    .catch(err => {
      console.error("Error:", err);
      mostrarMensaje("Error al cargar datos", "error");
    });
}

function cargarFotoPerfil() {
  const fotoUrl = `http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/get_profile_photo.php?usuario_id=${usuario_id}&t=${Date.now()}`;
  
  fotoPreview.src = fotoUrl;
  fotoPreview.onerror = function() {
    this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e0e0e0'/%3E%3Ccircle cx='100' cy='70' r='40' fill='%23999'/%3E%3Cellipse cx='100' cy='150' rx='60' ry='50' fill='%23999'/%3E%3C/svg%3E";
  };
}

inputFoto.addEventListener("change", function(e) {
  const archivo = e.target.files[0];
  
  if (!archivo) return;

  if (archivo.size > 5 * 1024 * 1024) {
    mostrarMensaje("La foto es muy grande (máximo 5MB)", "error");
    return;
  }

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!tiposPermitidos.includes(archivo.type)) {
    mostrarMensaje("Tipo de archivo no permitido. Usa JPG, PNG, GIF o WEBP", "error");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    fotoPreview.src = e.target.result;
  };
  reader.readAsDataURL(archivo);
  
  subirFoto(archivo);
});

function subirFoto(archivo) {
  const formData = new FormData();
  formData.append("foto", archivo);
  formData.append("usuario_id", usuario_id);
  
  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/upload_profile_photo.php", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      mostrarMensaje(data.error, "error");
      cargarFotoPerfil(); 
    } else {
      mostrarMensaje("Foto actualizada correctamente", "success");
    }
  })
  .catch(err => {
    console.error("Error:", err);
    mostrarMensaje("Error al subir foto", "error");
    cargarFotoPerfil();
  });
}

bioTextarea.addEventListener("input", function() {
  charCount.textContent = this.value.length + "/500";
});

formularioPerfil.addEventListener("submit", function(e) {
  e.preventDefault();
  
  const bio = bioTextarea.value.trim();
  
  if (bio.length > 500) {
    mostrarMensaje("La biografía no puede exceder 500 caracteres", "error");
    return;
  }
  
  mostrarMensaje("Perfil actualizado correctamente", "success");
});

function mostrarMensaje(texto, tipo) {
  mensajeResultado.textContent = texto;
  mensajeResultado.className = "mensaje " + tipo;
  
  setTimeout(() => {
    mensajeResultado.textContent = "";
    mensajeResultado.className = "mensaje";
  }, 3000);
}

function irAlFeed() {
  window.location.href = "Pagina_Social.html";
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = "Pagina_Login.html";
}

cargarDatos();
