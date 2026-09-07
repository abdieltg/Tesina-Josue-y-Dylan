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

if (!$data || !isset($data['usuario_id']) || !isset($data['post_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos incompletos']);
    exit;
}

$usuario_id = intval($data['usuario_id']);
$post_id = intval($data['post_id']);

$sql = "SELECT id FROM likes WHERE usuario_id = $usuario_id AND post_id = $post_id";
$result = $conexion->query($sql);

if ($result && $result->num_rows > 0) {
    $sql = "DELETE FROM likes WHERE usuario_id = $usuario_id AND post_id = $post_id";
    $conexion->query($sql);
    
    $sql = "UPDATE posts SET likes = likes - 1 WHERE id = $post_id";
    $conexion->query($sql);
    
    echo json_encode(['mensaje' => 'Like removido']);
} else {
    $sql = "INSERT INTO likes (usuario_id, post_id) VALUES ($usuario_id, $post_id)";
    $conexion->query($sql);
    
    $sql = "UPDATE posts SET likes = likes + 1 WHERE id = $post_id";
    $conexion->query($sql);
    
    echo json_encode(['mensaje' => 'Like agregado']);
}

$conexion->close();
?>