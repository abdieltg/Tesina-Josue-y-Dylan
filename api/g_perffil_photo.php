<?php
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'sharee';

$conexion = new mysqli($host, $user, $password, $database);

if ($conexion->connect_error) {
    http_response_code(500);
    die('Error de conexión');
}

$conexion->set_charset("utf8");

if (!isset($_GET['usuario_id']) || empty($_GET['usuario_id'])) {
    http_response_code(400);
    die('usuario_id requerido');
}

$usuario_id = intval($_GET['usuario_id']);

$sql = "SELECT foto_perfil, foto_tipo FROM perfiles WHERE usuario_id = $usuario_id";
$result = $conexion->query($sql);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    
    header('Content-Type: ' . $row['foto_tipo']);
    header('Content-Length: ' . strlen($row['foto_perfil']));
    header('Cache-Control: public, max-age=3600');
    
    echo $row['foto_perfil'];
} else {
    http_response_code(404);
    header('Content-Type: image/svg+xml');
    echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#e0e0e0"/>
        <circle cx="100" cy="70" r="40" fill="#999"/>
        <ellipse cx="100" cy="150" rx="60" ry="50" fill="#999"/>
        <text x="100" y="200" text-anchor="middle" fill="#666" font-size="14">Sin foto</text>
    </svg>';
}

$conexion->close();
?>
