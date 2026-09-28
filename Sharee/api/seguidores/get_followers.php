<?php
require_once '../conexion.php';
require_once '../sesion.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

$usuarioId = (int)($_GET['usuario_id'] ?? obtenerUsuarioAutenticado());

try {
    $stmt = $pdo->prepare("
        SELECT
            u.id,
            u.username,
            u.nombre,
            u.apellido
        FROM seguimientos s
        INNER JOIN usuarios u ON u.id = s.seguido_id
        WHERE s.seguidor_id = ?
    ");
    $stmt->execute([$usuarioId]);

    $seguidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt2 = $pdo->prepare("
        SELECT
            u.id,
            u.username,
            u.nombre,
            u.apellido
        FROM seguimientos s
        INNER JOIN usuarios u ON u.id = s.seguidor_id
        WHERE s.seguido_id = ?
    ");
    $stmt2->execute([$usuarioId]);

    $seguidores = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Seguidores cargados correctamente',
        'data' => [
            'seguidos' => $seguidos,
            'seguidores' => $seguidores
        ]
    ]);
} catch (PDOException $e) {
    error_log('Error al obtener seguidores: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudieron cargar los seguidores'
    ]);
}
?>