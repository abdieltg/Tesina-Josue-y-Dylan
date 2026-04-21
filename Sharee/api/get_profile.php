<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'sharee';

$conexion = new mysqli($host, $user, $password, $database);

if ($conexion->connect_error) {
    die(json_encode(['error' => 'Conexión fallida']));
}

$conexion->set_charset("utf8");

$usuario_id = intval($_GET['usuario_id']);

$sql = "SELECT id, username, email, avatar_url FROM usuarios WHERE id = $usuario_id";
$result = $conexion->query($sql);

if ($result->num_rows == 0) {
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

$usuario = $result->fetch_assoc();
echo json_encode($usuario);

$conexion->close();
?>