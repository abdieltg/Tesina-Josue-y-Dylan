<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
    die(json_encode(['error' => 'Error de conexión a la base de datos', 'success' => false]));
}

$conexion->set_charset("utf8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(400);
    echo json_encode(['error' => 'Método no permitido', 'success' => false]);
    exit;
}

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos JSON inválidos', 'success' => false]);
    exit;
}

$usuario_id = isset($data['usuario_id']) ? intval($data['usuario_id']) : null;
$bio = isset($data['bio']) ? $data['bio'] : '';
$avatar_url = isset($data['avatar_url']) ? $data['avatar_url'] : null;
$intereses = isset($data['intereses']) ? $data['intereses'] : [];

if (!$usuario_id) {
    http_response_code(400);
    echo json_encode(['error' => 'usuario_id requerido', 'success' => false]);
    exit;
}

// Limitar bio
if (strlen($bio) > 500) {
    $bio = substr($bio, 0, 500);
}

// Escapar valores
$bio_escaped = $conexion->real_escape_string($bio);
$avatar_url_escaped = $avatar_url ? $conexion->real_escape_string($avatar_url) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
$intereses_json = json_encode($intereses);
$intereses_escaped = $conexion->real_escape_string($intereses_json);

// Verificar si existe perfil
$sql_check = "SELECT id FROM perfiles WHERE usuario_id = $usuario_id";
$result_check = $conexion->query($sql_check);

try {
    if ($result_check && $result_check->num_rows > 0) {
        // UPDATE
        $sql = "UPDATE perfiles SET 
                bio = '$bio_escaped', 
                avatar_url = '$avatar_url_escaped', 
                intereses = '$intereses_escaped' 
                WHERE usuario_id = $usuario_id";
    } else {
        // INSERT
        $sql = "INSERT INTO perfiles (usuario_id, bio, avatar_url, intereses) 
                VALUES ($usuario_id, '$bio_escaped', '$avatar_url_escaped', '$intereses_escaped')";
    }
    
    if ($conexion->query($sql)) {
        // Actualizar avatar en usuarios también
        $sql_update_user = "UPDATE usuarios SET avatar_url = '$avatar_url_escaped' WHERE id = $usuario_id";
        $conexion->query($sql_update_user);
        
        echo json_encode([
            'success' => true,
            'mensaje' => 'Perfil actualizado correctamente',
            'bio' => $bio,
            'avatar_url' => $avatar_url_escaped,
            'intereses' => $intereses
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al guardar: ' . $conexion->error, 'success' => false]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Excepción: ' . $e->getMessage(), 'success' => false]);
}

$conexion->close();
?>
