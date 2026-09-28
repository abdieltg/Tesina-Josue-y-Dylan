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

$usuarioId = (int)($_GET['usuario_id'] ?? 0);
$tipo = $_GET['tipo'] ?? 'seguidores';

if ($usuarioId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuario inválido'
    ]);
    exit();
}

try {
    if ($tipo === 'seguidores') {
        $stmt = $pdo->prepare("
            SELECT u.id, u.nombre, u.apellido, u.username, u.avatar_url
            FROM seguimientos s
            INNER JOIN usuarios u ON u.id = s.seguidor_id
            WHERE s.seguido_id = ?
            ORDER BY u.nombre ASC
        ");
    } else {
        $stmt = $pdo->prepare("
            SELECT u.id, u.nombre, u.apellido, u.username, u.avatar_url
            FROM seguimientos s
            INNER JOIN usuarios u ON u.id = s.seguido_id
            WHERE s.seguidor_id = ?
            ORDER BY u.nombre ASC
        ");
    }

    $stmt->execute([$usuarioId]);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $usuarios
    ]);
} catch (PDOException $e) {
    error_log('Error al cargar lista: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar la lista'
    ]);
}
?>