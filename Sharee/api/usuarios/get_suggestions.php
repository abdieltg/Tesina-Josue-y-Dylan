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
        SELECT u.id, u.nombre, u.apellido, u.username, u.avatar_url
        FROM usuarios u
        WHERE u.id != ?
          AND u.id NOT IN (
              SELECT seguido_id FROM seguimientos WHERE seguidor_id = ?
          )
        ORDER BY u.created_at DESC
        LIMIT 5
    ");
    $stmt->execute([$usuarioActualId, $usuarioActualId]);
    $sugerencias = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $sugerencias
    ]);
} catch (PDOException $e) {
    error_log('Error sugerencias: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error cargando sugerencias'
    ]);
}
?>