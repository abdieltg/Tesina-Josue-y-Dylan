function obtenerRutaAvatar(avatarUrl) {
    if (!avatarUrl) {
        return null;
    }

    if (
        avatarUrl.startsWith('http://') ||
        avatarUrl.startsWith('https://') ||
        avatarUrl.startsWith('/')
    ) {
        return avatarUrl;
    }

    return `/Sharee/${avatarUrl}`;
}

function obtenerInicial(username) {
    const texto = String(username || 'U').trim();
    return texto.charAt(0).toUpperCase() || 'U';
}

function escaparHtml(texto) {
    const mapa = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return String(texto).replace(/[&<>"']/g, function (caracter) {
        return mapa[caracter];
    });
}

function crearAvatarHTML(usuario, clase = 'avatar-md') {
    const username = usuario?.username || 'usuario';
    const avatarUrl = obtenerRutaAvatar(usuario?.avatar_url);
    const inicial = obtenerInicial(username);

    if (avatarUrl) {
        return `
            <img
                src="${escaparHtml(avatarUrl)}"
                alt="Avatar de @${escaparHtml(username)}"
                class="avatar-img ${clase}"
            >
        `;
    }

    return `
        <div
            class="avatar ${clase}"
            role="img"
            aria-label="Avatar de @${escaparHtml(username)}"
        >
            ${escaparHtml(inicial)}
        </div>
    `;
}

function actualizarAvatarElemento(elemento, usuario, clase = 'avatar-md') {
    if (!elemento) {
        return;
    }

    elemento.innerHTML = crearAvatarHTML(usuario, clase);
}