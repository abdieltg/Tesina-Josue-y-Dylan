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
$mensajeId = (int)($_POST['mensaje_id'] ?? 0);
$contenido = trim((string)($_POST['contenido'] ?? ''));

if ($mensajeId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Mensaje inválido'
    ]);
    exit();
}

if ($contenido === '') {
    echo json_encode([
        'success' => false,
        'message' => 'El mensaje no puede quedar vacío'
    ]);
    exit();
}

if (strlen($contenido) > 1000) {
    echo json_encode([
        'success' => false,
        'message' => 'El mensaje supera el máximo permitido'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT remitente_id, TIMESTAMPDIFF(MINUTE, created_at, NOW()) AS minutos
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
            'message' => 'No tenés permiso para editar este mensaje'
        ]);
        exit();
    }

    if ((int)$mensaje['minutos'] > 10) {
        echo json_encode([
            'success' => false,
            'message' => 'El mensaje ya no puede editarse porque pasaron más de 10 minutos'
        ]);
        exit();
    }

    $update = $pdo->prepare("
        UPDATE mensajes
        SET contenido = ?
        WHERE id = ?
    ");
    $update->execute([$contenido, $mensajeId]);

    echo json_encode([
        'success' => true,
        'message' => 'Mensaje editado correctamente'
    ]);
} catch (PDOException $e) {
    error_log('Error editando mensaje: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo editar el mensaje'
    ]);
}
?>