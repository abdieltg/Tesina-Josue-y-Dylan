<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'sharee';

$conexion = new mysqli($host, $user, $password, $database);

if ($conexion->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Conexión fallida: ' . $conexion->connect_error]);
    exit;
}

$conexion->set_charset("utf8");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['post_id']) || !isset($data['usuario_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos incompletos']);
    exit;
}

$post_id = intval($data['post_id']);
$usuario_id = intval($data['usuario_id']);

$sql = "DELETE FROM posts WHERE id = $post_id AND usuario_id = $usuario_id";

if ($conexion->query($sql)) {
    echo json_encode(['mensaje' => 'Post eliminado']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Error al eliminar post: ' . $conexion->error]);
}

$conexion->close();
?>