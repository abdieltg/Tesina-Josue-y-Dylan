const postInput = document.getElementById("postInput");
const publicarBtn = document.getElementById("publicarBtn");
const postsContainer = document.getElementById("posts");

let posts = JSON.parse(localStorage.getItem("posts")) || [];

function guardarPosts() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

function renderPosts() {
  postsContainer.innerHTML = "";

  posts.forEach((post, index) => {
    const div = document.createElement("div");
    div.classList.add("post");

    div.innerHTML = `
<div class="post-header">
<img src="https://i.pravatar.cc/40">
<span>usuario</span>
</div>

<p>${post.texto}</p>

<div class="post-actions">
<button onclick="likePost(${index})">❤️ ${post.likes}</button>
<button onclick="deletePost(${index})">🗑</button>
</div>
`;

    postsContainer.appendChild(div);
  });
}

publicarBtn.addEventListener("click", () => {
  const texto = postInput.value.trim();

  if (texto === "") return;

  posts.unshift({
    texto: texto,
    likes: 0
  });

  guardarPosts();
  postInput.value = "";
  renderPosts();
});

function likePost(index) {
  posts[index].likes++;
  guardarPosts();
  renderPosts();
}

function deletePost(index) {
  posts.splice(index, 1);
  guardarPosts();
  renderPosts();
}

document.querySelectorAll(".seguir").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.textContent = "Siguiendo";
    btn.style.background = "#aaa";
  });
});

renderPosts();
