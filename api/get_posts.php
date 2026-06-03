<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'sharee';

$conexion = new mysqli($host, $user, $password, $database);

if ($conexion->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Conexión fallida']);
    exit;
}

$conexion->set_charset("utf8");

$sql = "SELECT p.id, p.contenido, p.likes, p.created_at, u.id as usuario_id, u.username, u.avatar_url FROM posts p JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.created_at DESC";

$result = $conexion->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en query']);
    exit;
}

$posts = array();
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}

echo json_encode($posts);
$conexion->close();
?>