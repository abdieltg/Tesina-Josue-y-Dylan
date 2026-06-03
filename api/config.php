<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'sharee';

$conexion = new mysqli($host, $user, $password, $database);
if ($conexion->connect_error) {
    die(json_encode(['error' => 'Conexión fallida: ' . $conexion->connect_error]));
}
$conexion->set_charset("utf8");
?>