let usuario_id = localStorage.getItem("usuario_id");
let username = localStorage.getItem("username");

if (!usuario_id) {
  window.location.href = "Pagina_Login.html";
}

const BASE_URL = "http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/";

// Array de fotos predefinidas - igual que en las otras páginas
const FOTOS_PREDEFINIDAS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Elijah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Freya',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Harper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kira',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
];

const INTERESES = [
  'Tecnología', 'Deportes', 'Música', 'Arte', 'Viajes', 'Gastronomía',
  'Cine', 'Lectura', 'Fotografía', 'Juegos', 'Naturaleza', 'Moda',
  'Diseño', 'Educación', 'Fitness', 'Cooking', 'Programación', 'Escritura',
  'Danza', 'Jardinería'
];

let fotoSeleccionada = null;
let interesesSeleccionados = [];

// Cargar datos del usuario
function cargarDatos() {
  fetch(BASE_URL + "get_profile.php?usuario_id=" + usuario_id)
    .then(res => res.json())
    .then(data => {
      document.getElementById("username").value = data.username || '';
      document.getElementById("email").value = data.email || '';
      document.getElementById("bio").value = data.bio || '';
      document.getElementById("charCount").textContent = (data.bio || '').length + "/500";
      
      // Foto
      if (data.avatar_url && data.avatar_url.trim() !== '') {
        fotoSeleccionada = data.avatar_url;
      } else {
        fotoSeleccionada = FOTOS_PREDEFINIDAS[0];
      }
      document.getElementById("fotoPreview").src = fotoSeleccionada;
      
      // Intereses
      if (data.intereses) {
        try {
          interesesSeleccionados = typeof data.intereses === 'string' ? JSON.parse(data.intereses) : data.intereses;
        } catch(e) {
          interesesSeleccionados = [];
        }
      }
      
      generarIntereses();
    })
    .catch(err => {
      console.error("Error:", err);
      fotoSeleccionada = FOTOS_PREDEFINIDAS[0];
      document.getElementById("fotoPreview").src = fotoSeleccionada;
      generarIntereses();
    });
}

// Generar grid de fotos
function generarGridFotos() {
  const grid = document.getElementById("fotosGrid");
  grid.innerHTML = '';
  
  FOTOS_PREDEFINIDAS.forEach(foto => {
    const div = document.createElement('div');
    div.className = 'foto-option' + (foto === fotoSeleccionada ? ' selected' : '');
    
    const img = document.createElement('img');
    img.src = foto;
    
    div.onclick = () => {
      document.querySelectorAll('.foto-option').forEach(d => d.classList.remove('selected'));
      div.classList.add('selected');
      fotoSeleccionada = foto;
    };
    
    div.appendChild(img);
    grid.appendChild(div);
  });
}

// Abrir modal
document.getElementById("cambiarFotoBtn").addEventListener("click", function() {
  generarGridFotos();
  document.getElementById("modalFotos").classList.add("active");
});

// Cerrar modal
document.getElementById("closeModal").addEventListener("click", function() {
  document.getElementById("modalFotos").classList.remove("active");
});

document.getElementById("cancelarFoto").addEventListener("click", function() {
  document.getElementById("modalFotos").classList.remove("active");
});

// Confirmar foto
document.getElementById("confirmarFoto").addEventListener("click", function() {
  document.getElementById("fotoPreview").src = fotoSeleccionada;
  document.getElementById("modalFotos").classList.remove("active");
});

// Cerrar modal al hacer click fuera
window.addEventListener("click", function(e) {
  const modal = document.getElementById("modalFotos");
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});

// Generar botones de intereses
function generarIntereses() {
  const grid = document.getElementById("interesesGrid");
  grid.innerHTML = '';
  
  INTERESES.forEach(interes => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "interes-btn" + (interesesSeleccionados.includes(interes) ? " selected" : "");
    btn.textContent = interes;
    
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      
      if (interesesSeleccionados.includes(interes)) {
        interesesSeleccionados = interesesSeleccionados.filter(i => i !== interes);
        btn.classList.remove("selected");
      } else {
        if (interesesSeleccionados.length < 5) {
          interesesSeleccionados.push(interes);
          btn.classList.add("selected");
        } else {
          alert("Máximo 5 intereses");
          return;
        }
      }
      
      document.getElementById("contadorIntereses").textContent = interesesSeleccionados.length;
    });
    
    grid.appendChild(btn);
  });
}

// Bio contador
document.getElementById("bio").addEventListener("input", function() {
  document.getElementById("charCount").textContent = this.value.length + "/500";
});

// Guardar perfil
document.getElementById("formularioPerfil").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const bio = document.getElementById("bio").value.trim();
  
  if (!fotoSeleccionada) {
    fotoSeleccionada = FOTOS_PREDEFINIDAS[0];
  }
  
  const datos = {
    usuario_id: parseInt(usuario_id),
    bio: bio,
    avatar_url: fotoSeleccionada,
    intereses: interesesSeleccionados
  };
  
  fetch(BASE_URL + "actualizar_perfil.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success || data.error === undefined) {
      document.getElementById("mensajeResultado").textContent = "Perfil actualizado correctamente";
      document.getElementById("mensajeResultado").className = "mensaje success";
    } else {
      document.getElementById("mensajeResultado").textContent = "Error: " + (data.error || "Desconocido");
      document.getElementById("mensajeResultado").className = "mensaje error";
    }
    
    setTimeout(() => {
      document.getElementById("mensajeResultado").textContent = "";
      document.getElementById("mensajeResultado").className = "mensaje";
    }, 3000);
  })
  .catch(err => {
    document.getElementById("mensajeResultado").textContent = "Error de conexión";
    document.getElementById("mensajeResultado").className = "mensaje error";
  });
});

// Funciones navegación
function irAlFeed() {
  window.location.href = "Pagina_Social.html";
}

function cerrarSesion() {
  if (confirm("¿Cerrar sesión?")) {
    localStorage.clear();
    window.location.href = "Pagina_Login.html";
  }
}

// Inicializar
cargarDatos();
