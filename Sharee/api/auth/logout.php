<?php
require_once '../sesion.php';

cerrarSesion();

// Redirigir a login
header('Location: /Sharee/login.html');
exit();
?>