// ===== DATOS EN MEMORIA =====
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let conversations = JSON.parse(localStorage.getItem('conversations')) || [];
let editingPostId = null; // Para controlar si estamos editando

// ===== FUNCIONES DE AUTENTICACIÓN =====
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    const password = this.querySelector('input[type="password"]').value;

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        switchScreen('mainScreen');
        loadPosts();
        loadTrends();
        loadConversations();
        this.reset();
    } else {
        alert('Correo o contraseña incorrectos');
    }
});

document.getElementById('signupForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelectorAll('input[type="email"]')[0].value;
    const password = this.querySelectorAll('input[type="password"]')[0].value;
    const confirmPassword = this.querySelectorAll('input[type="password"]')[1].value;

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    if (users.find(u => u.email === email)) {
        alert('Este correo ya está registrado');
        return;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        avatar: `https://via.placeholder.com/40?text=${name.charAt(0)}`
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('¡Cuenta creada exitosamente! Inicia sesión');
    switchScreen('loginScreen');
    this.reset();
});

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        switchScreen('loginScreen');
        document.getElementById('loginForm').reset();
        document.getElementById('signupForm').reset();
    }
}

// ===== FUNCIONES DE NAVEGACIÓN =====
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
}

// ===== FUNCIONES DE PUBLICACIONES =====
function publishPost() {
    const input = document.getElementById('postInput');
    const content = input.value.trim();

    if (!content) {
        alert('Escribe algo para publicar');
        return;
    }

    if (editingPostId) {
        // Modo edición
        const post = posts.find(p => p.id === editingPostId);
        if (post) {
            post.content = content;
            post.edited = true;
            post.editedAt = new Date();
            localStorage.setItem('posts', JSON.stringify(posts));
            editingPostId = null;
            
            // Cambiar botón de vuelta a "Publicar"
            const publishBtn = document.querySelector('.action-btn:last-child');
            publishBtn.textContent = 'Publicar';
            
            // Limpiar input
            input.value = '';
            input.placeholder = '¿Qué estás pensando?';
            
            alert('Publicación editada correctamente');
            loadPosts();
        }
    } else {
        // Modo crear
        const post = {
            id: Date.now(),
            author: currentUser.name,
            authorId: currentUser.id,
            avatar: currentUser.avatar,
            content: content,
            timestamp: new Date(),
            likes: 0,
            comments: 0,
            shares: 0,
            liked: false,
            edited: false,
            editedAt: null
        };

        posts.unshift(post);
        localStorage.setItem('posts', JSON.stringify(posts));
        input.value = '';
        loadPosts();
    }
}

function loadPosts() {
    const feed = document.getElementById('postsFeed');
    feed.innerHTML = '';

    posts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.className = 'post';
        const timeAgo = getTimeAgo(new Date(post.timestamp));
        
        // Verificar si el post es del usuario actual
        const isOwnPost = currentUser.id === post.authorId;

        postEl.innerHTML = `
            <div class="post-header">
                <div class="post-user">
                    <img src="${post.avatar}" alt="${post.author}" class="avatar-small">
                    <div class="post-user-info">
                        <h4>${post.author}</h4>
                        <p>${timeAgo}${post.edited ? ' (editado)' : ''}</p>
                    </div>
                </div>
                <div class="post-menu">
                    ${isOwnPost ? `
                        <button class="menu-btn" onclick="togglePostMenu(${post.id})">⋮</button>
                        <div id="menu-${post.id}" class="post-options-menu">
                            <button onclick="editPost(${post.id})">✏️ Editar</button>
                            <button onclick="deletePost(${post.id})">🗑️ Eliminar</button>
                        </div>
                    ` : `<span>⋮</span>`}
                </div>
            </div>
            <div class="post-content">
                ${post.content}
            </div>
            <div class="post-actions">
                <div class="post-action" onclick="likePost(${post.id})">
                    <span>${post.liked ? '❤️' : '🤍'}</span> ${post.likes}
                </div>
                <div class="post-action">
                    <span>💬</span> ${post.comments}
                </div>
                <div class="post-action">
                    <span>↗️</span> ${post.shares}
                </div>
            </div>
        `;
        feed.appendChild(postEl);
    });
}

function togglePostMenu(postId) {
    const menu = document.getElementById(`menu-${postId}`);
    menu.classList.toggle('active');
    
    // Cerrar otros menús
    document.querySelectorAll('.post-options-menu').forEach(m => {
        if (m.id !== `menu-${postId}`) {
            m.classList.remove('active');
        }
    });
}

function editPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post && currentUser.id === post.authorId) {
        editingPostId = postId;
        const input = document.getElementById('postInput');
        input.value = post.content;
        input.placeholder = 'Editando publicación...';
        input.focus();
        
        // Cambiar texto del botón
        const publishBtn = document.querySelector('.action-btn:last-child');
        publishBtn.textContent = 'Guardar cambios';
        
        // Scroll al input
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Cerrar menú
        togglePostMenu(postId);
    }
}

function deletePost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post && currentUser.id === post.authorId) {
        if (confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
            posts = posts.filter(p => p.id !== postId);
            localStorage.setItem('posts', JSON.stringify(posts));
            editingPostId = null;
            
            // Resetear input si estaba editando
            const input = document.getElementById('postInput');
            input.value = '';
            input.placeholder = '¿Qué estás pensando?';
            const publishBtn = document.querySelector('.action-btn:last-child');
            publishBtn.textContent = 'Publicar';
            
            loadPosts();
        }
    }
}

function cancelEdit() {
    editingPostId = null;
    const input = document.getElementById('postInput');
    input.value = '';
    input.placeholder = '¿Qué estás pensando?';
    const publishBtn = document.querySelector('.action-btn:last-child');
    publishBtn.textContent = 'Publicar';
}

function likePost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
        localStorage.setItem('posts', JSON.stringify(posts));
        loadPosts();
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString();
}

// ===== FUNCIONES DE EXPLORAR =====
function loadTrends() {
    const trends = [
        { title: '#Tecnología', posts: 45200 },
        { title: '#JavaScript', posts: 32100 },
        { title: '#WebDevelopment', posts: 28900 },
        { title: '#SocialMedia', posts: 19400 }
    ];

    const trendsList = document.getElementById('trendsList');
    trendsList.innerHTML = '';

    trends.forEach(trend => {
        const trendEl = document.createElement('div');
        trendEl.className = 'trend-item';
        trendEl.innerHTML = `
            <h4>${trend.title}</h4>
            <p>${trend.posts.toLocaleString()} publicaciones</p>
        `;
        trendsList.appendChild(trendEl);
    });

    const trendingList = document.getElementById('trendingList');
    if (trendingList) {
        trendingList.innerHTML = '';
        trends.forEach(trend => {
            const trendEl = document.createElement('div');
            trendEl.className = 'trending-item';
            trendEl.innerHTML = `
                <p>Tendencia mundial</p>
                <h4>${trend.title}</h4>
                <p>${trend.posts.toLocaleString()} publicaciones</p>
            `;
            trendingList.appendChild(trendEl);
        });
    }
}

// ===== FUNCIONES DE MENSAJES =====
function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;

    conversationsList.innerHTML = '';

    if (conversations.length === 0) {
        conversations = [
            { id: 1, name: 'Juan García', lastMessage: 'Hola, ¿cómo estás?', unread: 2 },
            { id: 2, name: 'María López', lastMessage: 'El proyecto está casi listo', unread: 0 },
            { id: 3, name: 'Pedro Ruiz', lastMessage: '¿Nos vemos mañana?', unread: 1 }
        ];
        localStorage.setItem('conversations', JSON.stringify(conversations));
    }

    conversations.forEach(conv => {
        const convEl = document.createElement('div');
        convEl.className = 'conversation-item';
        convEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${conv.name}</strong>
                ${conv.unread > 0 ? `<span style="background: #667eea; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">${conv.unread}</span>` : ''}
            </div>
            <p>${conv.lastMessage}</p>
        `;
        conversationsList.appendChild(convEl);
    });
}

// ===== INICIALIZACIÓN =====
window.addEventListener('load', function() {
    if (currentUser) {
        switchScreen('mainScreen');
        loadPosts();
        loadTrends();
        loadConversations();
    } else {
        switchScreen('loginScreen');
    }
});

// Cerrar menú de post al hacer click fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.post-menu')) {
        document.querySelectorAll('.post-options-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }
});s