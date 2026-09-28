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

$usuarioId = obtenerUsuarioAutenticado();
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data === null) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos'
    ]);
    exit();
}

$publicacionId = (int)($data['publicacion_id'] ?? 0);

if ($publicacionId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Publicación inválida'
    ]);
    exit();
}

try {
    // Verificar que la publicación pertenece al usuario
    $checkStmt = $pdo->prepare("
        SELECT usuario_id FROM publicaciones WHERE id = ?
    ");
    $checkStmt->execute([$publicacionId]);
    $post = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        echo json_encode([
            'success' => false,
            'message' => 'Publicación no encontrada'
        ]);
        exit();
    }

    if ($post['usuario_id'] != $usuarioId) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'No tienes permiso para eliminar esta publicación'
        ]);
        exit();
    }

    $pdo->beginTransaction();

    // Eliminar likes
    $stmt = $pdo->prepare("DELETE FROM likes WHERE publicacion_id = ?");
    $stmt->execute([$publicacionId]);

    // Eliminar comentarios
    $stmt = $pdo->prepare("DELETE FROM comentarios WHERE publicacion_id = ?");
    $stmt->execute([$publicacionId]);

    // Eliminar hashtags relacionados
    $stmt = $pdo->prepare("DELETE FROM publicacion_hashtags WHERE publicacion_id = ?");
    $stmt->execute([$publicacionId]);

    // Eliminar publicación
    $stmt = $pdo->prepare("DELETE FROM publicaciones WHERE id = ?");
    $stmt->execute([$publicacionId]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Publicación eliminada correctamente'
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Error al eliminar publicación: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo eliminar la publicación'
    ]);
}
?>