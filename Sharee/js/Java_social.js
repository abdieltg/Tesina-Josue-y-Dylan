const postInput = document.getElementById("postInput");
const publicarBtn = document.getElementById("publicarBtn");
const postsContainer = document.getElementById("posts");

let usuario_id = localStorage.getItem("usuario_id");
let username = localStorage.getItem("username");

if (!usuario_id) {
  window.location.href = "Pagina_Login.html";
}

function cargarPosts() {
  fetch("http://localhost/sharee/api/get_posts.php")
    .then(res => res.json())
    .then(posts => {
      postsContainer.innerHTML = "";
      
      if (posts.length === 0) {
        postsContainer.innerHTML = "<p style='text-align: center; color: #999;'>No hay posts aún</p>";
        return;
      }
      
      posts.forEach((post) => {
        const div = document.createElement("div");
        div.classList.add("post");
        
        let botonEliminar = "";
        if (post.usuario_id == usuario_id) {
          botonEliminar = `<button onclick="deletePost(${post.id})">🗑</button>`;
        }
        
        div.innerHTML = `
          <div class="post-header">
            <img src="${post.avatar_url}">
            <span>${post.username}</span>
          </div>
          <p>${post.contenido}</p>
          <div class="post-actions">
            <button onclick="likePost(${post.id})">❤️ ${post.likes}</button>
            ${botonEliminar}
          </div>
        `;
        
        postsContainer.appendChild(div);
      });
    })
    .catch(err => console.error("Error al cargar posts:", err));
}

publicarBtn.addEventListener("click", () => {
  const contenido = postInput.value.trim();
  
  if (contenido === "") {
    alert("Escribe algo para publicar");
    return;
  }
  
  fetch("http://localhost/sharee/api/create_post.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id, contenido })
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
  .catch(err => console.error("Error:", err));
});

function likePost(post_id) {
  fetch("http://localhost/sharee/api/like_post.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id, post_id })
  })
  .then(res => res.json())
  .then(data => {
    cargarPosts();
  })
  .catch(err => console.error("Error:", err));
}

function deletePost(post_id) {
  if (confirm("¿Estás seguro de que quieres eliminar este post?")) {
    fetch("http://localhost/sharee/api/delete_post.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id, post_id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
      } else {
        cargarPosts();
      }
    })
    .catch(err => console.error("Error:", err));
  }
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = "Pagina_Login.html";
}

cargarPosts();

setInterval(cargarPosts, 5000);