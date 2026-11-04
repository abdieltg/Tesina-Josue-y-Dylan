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
$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos'
    ]);
    exit();
}

$mensajeId = (int)($data['mensaje_id'] ?? 0);

if ($mensajeId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Mensaje inválido'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT remitente_id
        FROM mensajes
        WHERE id = ?
    ");
    $stmt->execute([$mensajeId]);
    $mensaje = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$mensaje) {
        echo json_encode([
            'success' => false,
            'message' => 'Mensaje no encontrado'
        ]);
        exit();
    }

    if ((int)$mensaje['remitente_id'] !== (int)$usuarioActualId) {
        echo json_encode([
            'success' => false,
            'message' => 'No tenés permiso para eliminar este mensaje'
        ]);
        exit();
    }

    $delete = $pdo->prepare("
        DELETE FROM mensajes
        WHERE id = ?
    ");
    $delete->execute([$mensajeId]);

    echo json_encode([
        'success' => true,
        'message' => 'Mensaje eliminado correctamente'
    ]);
} catch (PDOException $e) {
    error_log('Error eliminando mensaje: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo eliminar el mensaje'
    ]);
}
?>