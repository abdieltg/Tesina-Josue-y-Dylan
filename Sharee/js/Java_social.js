const postInput = document.getElementById("postInput");
const publicarBtn = document.getElementById("publicarBtn");
const postsContainer = document.getElementById("posts");
const sugerenciasContainer = document.getElementById("sugerencias");

let usuario_id = localStorage.getItem("usuario_id");
let username = localStorage.getItem("username");
let avatar_url = localStorage.getItem("avatar_url");

if (!usuario_id) {
  window.location.href = "Pagina_Login.html";
}

function cargarAvatarUsuario() {
  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/get_profile.php?usuario_id=" + usuario_id)
    .then(res => res.json())
    .then(data => {
      if (data.avatar_url) {
        document.getElementById("avatar").src = data.avatar_url;
        document.getElementById("avatarPost").src = data.avatar_url;
        localStorage.setItem("avatar_url", data.avatar_url);
      }
    })
    .catch(err => console.error("Error cargando avatar:", err));
}

function cargarPosts() {
  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/get_posts.php")
    .then(res => res.json())
    .then(posts => {
      postsContainer.innerHTML = "";
      
      if (!Array.isArray(posts) || posts.length === 0) {
        postsContainer.innerHTML = "<p class='no-posts'>No hay publicaciones aún. Sé el primero en compartir.</p>";
        return;
      }
      
      posts.forEach((post) => {
        const div = document.createElement("div");
        div.classList.add("post");
        
        let botonEliminar = "";
        if (post.usuario_id == usuario_id) {
          botonEliminar = `<button class="btn-delete" onclick="deletePost(${post.id})">Eliminar</button>`;
        }
        
        const fechaPost = new Date(post.fecha_creacion);
        const ahora = new Date();
        const diferencia = Math.floor((ahora - fechaPost) / 60000);
        let tiempoFormato = "";
        
        if (diferencia < 1) {
          tiempoFormato = "Hace unos momentos";
        } else if (diferencia < 60) {
          tiempoFormato = `Hace ${diferencia} min`;
        } else if (diferencia < 1440) {
          tiempoFormato = `Hace ${Math.floor(diferencia / 60)} h`;
        } else {
          tiempoFormato = fechaPost.toLocaleDateString();
        }
        
        div.innerHTML = `
          <div class="post-header">
            <div class="post-header-left">
              <img src="${post.avatar_url}" onclick="irAlPerfil(${post.usuario_id})" title="Ver perfil" />
              <div class="info">
                <div class="username" onclick="irAlPerfil(${post.usuario_id})" title="Ver perfil">${post.username}</div>
                <div class="time">${tiempoFormato}</div>
              </div>
            </div>
            ${botonEliminar}
          </div>
          <p class="post-content">${post.contenido}</p>
          <div class="post-actions">
            <button onclick="likePost(${post.id})">Me gusta (${post.likes})</button>
          </div>
        `;
        
        postsContainer.appendChild(div);
      });
    })
    .catch(err => {
      console.error("Error al cargar posts:", err);
      postsContainer.innerHTML = "<p class='no-posts' style='color: #ff6b6b;'>Error al cargar las publicaciones</p>";
    });
}

function cargarSugerencias() {
  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/get_all_users.php")
    .then(res => res.json())
    .then(usuarios => {
      sugerenciasContainer.innerHTML = "";
      
      if (!Array.isArray(usuarios)) {
        return;
      }
      
      const usuariosFiltrados = usuarios.filter(u => u.id != usuario_id).slice(0, 5);
      
      if (usuariosFiltrados.length === 0) {
        sugerenciasContainer.innerHTML = "<p style='text-align: center; color: #aaa; padding: 15px;'>No hay más usuarios</p>";
        return;
      }
      
      usuariosFiltrados.forEach(usuario => {
        const div = document.createElement("div");
        div.classList.add("usuario");
        
        div.innerHTML = `
          <div class="usuario-info">
            <img src="${usuario.avatar_url}" onclick="irAlPerfil(${usuario.id})" title="Ver perfil" />
            <span onclick="irAlPerfil(${usuario.id})" title="Ver perfil">${usuario.username}</span>
          </div>
          <button onclick="toggleSeguirUsuario(${usuario.id})" class="seguir">Seguir</button>
        `;
        
        sugerenciasContainer.appendChild(div);
      });
    })
    .catch(err => console.error("Error al cargar sugerencias:", err));
}

publicarBtn.addEventListener("click", () => {
  const contenido = postInput.value.trim();
  
  if (contenido === "") {
    alert("Escribe algo para publicar");
    return;
  }

  if (contenido.length > 500) {
    alert("El post es demasiado largo (máximo 500 caracteres)");
    return;
  }
  
  publicarBtn.disabled = true;
  publicarBtn.textContent = "Publicando...";
  
  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/create_post.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id: parseInt(usuario_id), contenido })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert("Error: " + data.error);
    } else {
      postInput.value = "";
      cargarPosts();
    }
    publicarBtn.disabled = false;
    publicarBtn.textContent = "Publicar";
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Error al publicar");
    publicarBtn.disabled = false;
    publicarBtn.textContent = "Publicar";
  });
});

function likePost(post_id) {
  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/like_post.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id: parseInt(usuario_id), post_id: parseInt(post_id) })
  })
  .then(res => res.json())
  .then(data => {
    cargarPosts();
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Error al dar me gusta");
  });
}

function deletePost(post_id) {
  if (confirm("¿Estás seguro de que deseas eliminar este post?")) {
    fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/delete_post.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id: parseInt(usuario_id), post_id: parseInt(post_id) })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("Post eliminado correctamente");
        cargarPosts();
      }
    })
    .catch(err => {
      console.error("Error:", err);
      alert("Error al eliminar post");
    });
  }
}

function toggleSeguirUsuario(usuario_id_seguido) {
  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/toggle_follow.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      seguidor_id: parseInt(usuario_id), 
      seguido_id: parseInt(usuario_id_seguido)
    })
  })
  .then(res => res.json())
  .then(data => {
    cargarSugerencias();
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Error al seguir usuario");
  });
}

function irAlPerfil(id) {
  if (id == usuario_id) {
    irAlPerfilPropio();
  } else {
    window.location.href = "Pagina_Perfil.html?id=" + id;
  }
}

function irAlPerfilPropio() {
  window.location.href = "Pagina_Perfil.html?id=" + usuario_id;
}

function cerrarSesion() {
  if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
    localStorage.clear();
    window.location.href = "Pagina_Login.html";
  }
}

cargarAvatarUsuario();
cargarPosts();
cargarSugerencias();

setInterval(cargarPosts, 5000);
