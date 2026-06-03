let usuario_id_actual = localStorage.getItem("usuario_id");
let usuario_id_perfil = null; 

function obtenerUsuarioDePerfil() {
    const params = new URLSearchParams(window.location.search);
    usuario_id_perfil = params.get("id");
    
    if (!usuario_id_perfil) {
        alert("Usuario no encontrado");
        window.location.href = "Pagina_Social.html";
        return;
    }
    
    cargarPerfil();
    cargarPostsDelUsuario();
    verificarSiSigue();
}

function cargarPerfil() {
    fetch("http://localhost/sharee/api/get_profile.php?usuario_id=" + usuario_id_perfil)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            document.getElementById("avatarPerfil").src = data.avatar_url;
            document.getElementById("usernamePerfil").textContent = data.username;
            document.getElementById("emailPerfil").textContent = data.email;
            document.getElementById("usernamePostsTitle").textContent = data.username;
            
            fetch("http://localhost/sharee/api/get_stats.php?usuario_id=" + usuario_id_perfil)
                .then(res => res.json())
                .then(stats => {
                    document.getElementById("postCount").textContent = stats.posts;
                    document.getElementById("followerCount").textContent = stats.followers;
                    document.getElementById("followingCount").textContent = stats.following;
                });
        })
        .catch(err => console.error("Error:", err));
}
function cargarPostsDelUsuario() {
    fetch("http://localhost/sharee/api/get_user_posts.php?usuario_id=" + usuario_id_perfil)
        .then(res => res.json())
        .then(posts => {
            const container = document.getElementById("postsUsuario");
            container.innerHTML = "";
            
            if (posts.length === 0) {
                container.innerHTML = "<p style='text-align: center; color: #999;'>Este usuario aún no tiene posts</p>";
                return;
            }
            
            posts.forEach(post => {
                const div = document.createElement("div");
                div.classList.add("post");
                
                let botonEliminar = "";
                if (post.usuario_id == usuario_id_actual) {
                    botonEliminar = `<button onclick="deletePost(${post.id})">🗑 Eliminar</button>`;
                }
                
                div.innerHTML = `
                    <div class="post-header">
                        <img src="${post.avatar_url}" onclick="irAlPerfil(${post.usuario_id})">
                        <span onclick="irAlPerfil(${post.usuario_id})" style="cursor: pointer;">${post.username}</span>
                    </div>
                    <p>${post.contenido}</p>
                    <div class="post-actions">
                        <button onclick="likePost(${post.id})">❤️ ${post.likes}</button>
                        ${botonEliminar}
                    </div>
                `;
                
                container.appendChild(div);
            });
        })
        .catch(err => console.error("Error:", err));
}

function verificarSiSigue() {
    if (usuario_id_actual == usuario_id_perfil) {
        document.getElementById("btnSeguir").style.display = "none";
        return;
    }
    
    fetch("http://localhost/sharee/api/check_follow.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            seguidor_id: usuario_id_actual, 
            seguido_id: usuario_id_perfil 
        })
    })
    .then(res => res.json())
    .then(data => {
        const btn = document.getElementById("btnSeguir");
        if (data.siguiendo) {
            btn.textContent = "Dejando de seguir";
            btn.classList.add("siguiendo");
        } else {
            btn.textContent = "Seguir";
            btn.classList.remove("siguiendo");
        }
    });
}

function toggleSeguir() {
    fetch("http://localhost/sharee/api/toggle_follow.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            seguidor_id: usuario_id_actual, 
            seguido_id: usuario_id_perfil 
        })
    })
    .then(res => res.json())
    .then(data => {
        verificarSiSigue();
        cargarPerfil(); 
    });
}

function likePost(post_id) {
    fetch("http://localhost/sharee/api/like_post.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: usuario_id_actual, post_id })
    })
    .then(res => res.json())
    .then(() => {
        cargarPostsDelUsuario();
    });
}

function deletePost(post_id) {
    if (confirm("¿Estás seguro?")) {
        fetch("http://localhost/sharee/api/delete_post.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_id: usuario_id_actual, post_id })
        })
        .then(res => res.json())
        .then(() => {
            cargarPostsDelUsuario();
        });
    }
}

function irAlPerfil(id) {
    window.location.href = "Pagina_Perfil.html?id=" + id;
}

function irAlFeed() {
    window.location.href = "Pagina_Social.html";
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = "Pagina_Login.html";
}

obtenerUsuarioDePerfil();