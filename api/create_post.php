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

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['error' => 'No se recibieron datos']);
    exit;
}

$usuario_id = intval($data['usuario_id']);
$contenido = $conexion->real_escape_string($data['contenido']);

if (empty($contenido)) {
    echo json_encode(['error' => 'El post no puede estar vacío']);
    exit;
}

if ($usuario_id == 0) {
    echo json_encode(['error' => 'Usuario no identificado']);
    exit;
}

$sql = "INSERT INTO posts (usuario_id, contenido) VALUES ($usuario_id, '$contenido')";

if ($conexion->query($sql)) {
    echo json_encode(['mensaje' => 'Post creado correctamente', 'id' => $conexion->insert_id]);
} else {
    echo json_encode(['error' => 'Error al crear post']);
}

$conexion->close();
?>