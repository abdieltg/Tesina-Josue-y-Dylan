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

$sql = "SELECT p.id, p.contenido, p.likes, p.created_at, u.id as usuario_id, u.username, u.avatar_url
        FROM posts p
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.usuario_id = $usuario_id
        ORDER BY p.created_at DESC";

$result = $conexion->query($sql);

if (!$result) {
    echo json_encode(['error' => 'Error en query']);
    exit;
}

$posts = [];
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}

echo json_encode($posts);

$conexion->close();
?>