<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'sharee';

$conexion = new mysqli($host, $user, $password, $database);

if ($conexion->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Conexión fallida']));
}

$conexion->set_charset("utf8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(400);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No se recibió archivo o hubo un error']);
    exit;
}

if (!isset($_POST['usuario_id']) || empty($_POST['usuario_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'usuario_id requerido']);
    exit;
}

$usuario_id = intval($_POST['usuario_id']);
$archivo = $_FILES['foto'];

$tamaño_maximo = 5 * 1024 * 1024;
if ($archivo['size'] > $tamaño_maximo) {
    http_response_code(400);
    echo json_encode(['error' => 'La foto es muy grande (máximo 5MB)']);
    exit;
}

$tipos_permitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($archivo['type'], $tipos_permitidos)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de archivo no permitido. Usa JPG, PNG, GIF o WEBP']);
    exit;
}

$foto_contenido = file_get_contents($archivo['tmp_name']);
if ($foto_contenido === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al leer el archivo']);
    exit;
}

$foto_contenido_escaped = $conexion->real_escape_string($foto_contenido);
$foto_nombre = $conexion->real_escape_string($archivo['name']);
$foto_tipo = $conexion->real_escape_string($archivo['type']);

$sql_check = "SELECT id FROM perfiles WHERE usuario_id = $usuario_id";
$result_check = $conexion->query($sql_check);

if ($result_check->num_rows > 0) {
    $sql = "UPDATE perfiles SET foto_perfil = '$foto_contenido_escaped', foto_nombre = '$foto_nombre', foto_tipo = '$foto_tipo' WHERE usuario_id = $usuario_id";
} else {
    $sql = "INSERT INTO perfiles (usuario_id, foto_perfil, foto_nombre, foto_tipo) VALUES ($usuario_id, '$foto_contenido_escaped', '$foto_nombre', '$foto_tipo')";
}

if ($conexion->query($sql)) {
    $sql_update_user = "UPDATE usuarios SET avatar_url = 'perfil_$usuario_id' WHERE id = $usuario_id";
    $conexion->query($sql_update_user);
    
    echo json_encode(['mensaje' => 'Foto de perfil actualizada correctamente', 'foto_url' => "api/get_profile_photo.php?usuario_id=$usuario_id"]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar foto: ' . $conexion->error]);
}

$conexion->close();
?>