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

if (!$data || !isset($data['usuario_id']) || !isset($data['contenido'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos incompletos']);
    exit;
}

$usuario_id = intval($data['usuario_id']);
$contenido = $conexion->real_escape_string($data['contenido']);

if (empty($contenido)) {
    http_response_code(400);
    echo json_encode(['error' => 'El post no puede estar vacío']);
    exit;
}

if ($usuario_id == 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Usuario no identificado']);
    exit;
}

$sql = "INSERT INTO posts (usuario_id, contenido) VALUES ($usuario_id, '$contenido')";

if ($conexion->query($sql)) {
    echo json_encode(['mensaje' => 'Post creado correctamente', 'id' => $conexion->insert_id]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Error al crear post: ' . $conexion->error]);
}

$conexion->close();
?>