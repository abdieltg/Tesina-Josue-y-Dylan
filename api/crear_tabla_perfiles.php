<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'sharee';

$conexion = new mysqli($host, $user, $password, $database);

if ($conexion->connect_error) {
    die(json_encode(['error' => 'Conexión fallida: ' . $conexion->connect_error]));
}

$conexion->set_charset("utf8");

$sql = "CREATE TABLE IF NOT EXISTS perfiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    foto_perfil LONGBLOB,
    foto_nombre VARCHAR(255),
    foto_tipo VARCHAR(50),
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
)";

if ($conexion->query($sql) === TRUE) {
    echo json_encode(['mensaje' => 'Tabla perfiles creada correctamente']);
} else {
    echo json_encode(['error' => 'Error al crear tabla: ' . $conexion->error]);
}

$conexion->close();
?>