<?php
// Gestión de sesiones

session_start();

// Función para verificar si el usuario está autenticado
function estaAutenticado() {
    return isset($_SESSION['usuario_id']) && !empty($_SESSION['usuario_id']);
}

// Función para obtener el ID del usuario autenticado
function obtenerUsuarioAutenticado() {
    if (estaAutenticado()) {
        return $_SESSION['usuario_id'];
    }
    return null;
}

// Función para iniciar sesión de usuario
function iniciarSesionUsuario($usuario_id, $email, $username) {
    $_SESSION['usuario_id'] = $usuario_id;
    $_SESSION['email'] = $email;
    $_SESSION['username'] = $username;
}

// Función para cerrar sesión
function cerrarSesion() {
    session_destroy();
}

// Función para redirigir si no está autenticado
function verificarAutenticacion() {
    if (!estaAutenticado()) {
        header('Location: /Sharee/login.html');
        exit();
    }
}

// Función para redirigir si ya está autenticado
function verificarNoAutenticacion() {
    if (estaAutenticado()) {
        header('Location: /Sharee/inicio.html');
        exit();
    }
}
?>