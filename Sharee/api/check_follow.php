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

if (!$data || !isset($data['seguidor_id']) || !isset($data['seguido_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos incompletos']);
    exit;
}

$seguidor_id = intval($data['seguidor_id']);
$seguido_id = intval($data['seguido_id']);

$sql = "SELECT id FROM seguidores WHERE seguidor_id = $seguidor_id AND seguido_id = $seguido_id";
$result = $conexion->query($sql);

echo json_encode(['siguiendo' => $result && $result->num_rows > 0]);

$conexion->close();
?>