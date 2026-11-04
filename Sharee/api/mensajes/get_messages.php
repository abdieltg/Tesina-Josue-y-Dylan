<?php
require_once '../conexion.php';
require_once '../sesion.php';

header('Content-Type: application/json; charset=utf-8');

if (!estaAutenticado()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'No autenticado'
    ]);
    exit();
}

$usuarioActualId = obtenerUsuarioAutenticado();
$otroUsuarioId = (int)($_GET['usuario_id'] ?? 0);

if ($otroUsuarioId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuario inválido'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT id
        FROM conversaciones
        WHERE (usuario1_id = ? AND usuario2_id = ?)
           OR (usuario1_id = ? AND usuario2_id = ?)
        LIMIT 1
    ");
    $stmt->execute([$usuarioActualId, $otroUsuarioId, $otroUsuarioId, $usuarioActualId]);
    $conv = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$conv) {
        echo json_encode([
            'success' => true,
            'data' => [],
            'otro_usuario' => null
        ]);
        exit();
    }

    $conversacionId = (int)$conv['id'];

    $stmtUsuario = $pdo->prepare("
        SELECT id, nombre, apellido, username, avatar_url
        FROM usuarios
        WHERE id = ?
    ");
    $stmtUsuario->execute([$otroUsuarioId]);
    $otroUsuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT
            m.id,
            m.conversacion_id,
            m.remitente_id,
            m.contenido,
            m.imagen_url,
            m.created_at,
            m.leido,
            CASE WHEN m.remitente_id = ? THEN 1 ELSE 0 END AS is_owner
        FROM mensajes m
        WHERE m.conversacion_id = ?
        ORDER BY m.created_at ASC
    ");
    $stmt->execute([$usuarioActualId, $conversacionId]);
    $mensajes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmtUpdate = $pdo->prepare("
        UPDATE mensajes
        SET leido = 1
        WHERE conversacion_id = ?
          AND remitente_id != ?
          AND leido = 0
    ");
    $stmtUpdate->execute([$conversacionId, $usuarioActualId]);

    echo json_encode([
        'success' => true,
        'otro_usuario' => $otroUsuario,
        'data' => $mensajes
    ]);
} catch (PDOException $e) {
    error_log('Error cargando mensajes: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'No se pudieron cargar los mensajes'
    ]);
}
?>