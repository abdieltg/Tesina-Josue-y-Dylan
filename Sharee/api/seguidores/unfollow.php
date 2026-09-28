<?php
require_once '../conexion.php';
require_once '../sesion.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit();
}

if (!estaAutenticado()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Debes iniciar sesión'
    ]);
    exit();
}

$usuarioActualId = obtenerUsuarioAutenticado();
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data === null) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos'
    ]);
    exit();
}

$seguidoId = (int)($data['seguido_id'] ?? 0);

if ($seguidoId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuario inválido'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        DELETE FROM seguimientos
        WHERE seguidor_id = ? AND seguido_id = ?
    ");
    $stmt->execute([$usuarioActualId, $seguidoId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Dejaste de seguir al usuario'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No estabas siguiendo a este usuario'
        ]);
    }
} catch (PDOException $e) {
    error_log('Error al dejar de seguir: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo dejar de seguir al usuario'
    ]);
}
?>