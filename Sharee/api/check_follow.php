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

$seguidor_id = intval($data['seguidor_id']);
$seguido_id = intval($data['seguido_id']);

$sql = "SELECT id FROM seguidores WHERE seguidor_id = $seguidor_id AND seguido_id = $seguido_id";
$result = $conexion->query($sql);

$siguiendo = $result->num_rows > 0;

echo json_encode(['siguiendo' => $siguiendo]);

$conexion->close();
?>