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

if (!isset($_GET['usuario_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'usuario_id requerido']);
    exit;
}

$usuario_id = intval($_GET['usuario_id']);

$sql = "SELECT id, username, email, avatar_url FROM usuarios WHERE id = $usuario_id";
$result = $conexion->query($sql);

if (!$result || $result->num_rows == 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

$usuario = $result->fetch_assoc();
echo json_encode($usuario);

$conexion->close();
?>