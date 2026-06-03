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
        postsContainer.innerHTML = "<p style='text-align: center; color: #999;'>No hay posts aún</p>";
        return;
      }
      
      posts.forEach((post) => {
        const div = document.createElement("div");
        div.classList.add("post");
        
        let botonEliminar = "";
        if (post.usuario_id == usuario_id) {
          botonEliminar = `<button onclick="deletePost(${post.id})" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">🗑</button>`;
        }
        
        div.innerHTML = `
          <div class="post-header">
            <img src="${post.avatar_url}" onclick="irAlPerfil(${post.usuario_id})" style="cursor: pointer; width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            <span onclick="irAlPerfil(${post.usuario_id})" style="cursor: pointer; font-weight: bold;">${post.username}</span>
          </div>
          <p style="margin: 10px 0;">${post.contenido}</p>
          <div class="post-actions">
            <button onclick="likePost(${post.id})" style="background-color: #f39c12; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">❤️ ${post.likes}</button>
            ${botonEliminar}
          </div>
        `;
        
        postsContainer.appendChild(div);
      });
    })
    .catch(err => {
      console.error("Error al cargar posts:", err);
      postsContainer.innerHTML = "<p style='text-align: center; color: red;'>Error al cargar posts</p>";
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
      
      usuarios.slice(0, 5).forEach(usuario => {
        if (usuario.id != usuario_id) {
          const div = document.createElement("div");
          div.classList.add("usuario");
          div.style.display = "flex";
          div.style.alignItems = "center";
          div.style.justifyContent = "space-between";
          div.style.padding = "10px";
          div.style.borderBottom = "1px solid #eee";
          
          div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
              <img src="${usuario.avatar_url}" onclick="irAlPerfil(${usuario.id})" style="cursor: pointer; width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
              <span onclick="irAlPerfil(${usuario.id})" style="cursor: pointer; font-weight: 500;">${usuario.username}</span>
            </div>
            <button onclick="toggleSeguirUsuario(${usuario.id})" class="seguir" style="background-color: #3498db; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer;">Seguir</button>
          `;
          
          sugerenciasContainer.appendChild(div);
        }
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
  
  fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/create_post.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id: parseInt(usuario_id), contenido })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      postInput.value = "";
      cargarPosts();
    }
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Error al publicar");
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
    alert("Error al dar like");
  });
}

function deletePost(post_id) {
  if (confirm("¿Estás seguro de que quieres eliminar este post?")) {
    fetch("http://localhost/Tesina-Josue-y-Dylan-main/Sharee/api/delete_post.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id: parseInt(usuario_id), post_id: parseInt(post_id) })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
      } else {
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
  localStorage.clear();
  window.location.href = "Pagina_Login.html";
}

cargarAvatarUsuario();
cargarPosts();
cargarSugerencias();

setInterval(cargarPosts, 5000);