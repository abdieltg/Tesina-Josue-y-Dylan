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

try {
    $stmt = $pdo->prepare("
        SELECT
            c.id AS conversacion_id,
            CASE
                WHEN c.usuario1_id = ? THEN c.usuario2_id
                ELSE c.usuario1_id
            END AS user_id,
            u.nombre,
            u.apellido,
            u.username,
            u.avatar_url,
            m.contenido AS last_message,
            (m.remitente_id = ?) AS last_message_from_me,
            m.created_at
        FROM conversaciones c
        JOIN usuarios u
            ON u.id = CASE
                WHEN c.usuario1_id = ? THEN c.usuario2_id
                ELSE c.usuario1_id
            END
        LEFT JOIN mensajes m ON m.id = (
            SELECT MAX(m2.id)
            FROM mensajes m2
            WHERE m2.conversacion_id = c.id
        )
        WHERE c.usuario1_id = ?
           OR c.usuario2_id = ?
        ORDER BY m.created_at DESC, c.id DESC
    ");

    $stmt->execute([$usuarioActualId, $usuarioActualId, $usuarioActualId, $usuarioActualId, $usuarioActualId]);
    $conversaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $conversaciones
    ]);
} catch (PDOException $e) {
    error_log('Error cargando conversaciones: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'No se pudieron cargar las conversaciones'
    ]);
}
?>