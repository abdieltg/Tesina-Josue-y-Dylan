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
        'message' => 'Debes iniciar sesión para editar'
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

$comentarioId = (int)($data['comentario_id'] ?? 0);
$contenido = trim($data['contenido'] ?? '');

if ($comentarioId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Comentario inválido'
    ]);
    exit();
}

if ($contenido === '') {
    echo json_encode([
        'success' => false,
        'message' => 'El comentario no puede estar vacío'
    ]);
    exit();
}

if (strlen($contenido) > 500) {
    echo json_encode([
        'success' => false,
        'message' => 'El comentario supera el máximo de caracteres'
    ]);
    exit();
}

try {
    // Verificar que el comentario pertenece al usuario
    $checkStmt = $pdo->prepare("
        SELECT usuario_id FROM comentarios WHERE id = ?
    ");
    $checkStmt->execute([$comentarioId]);
    $comment = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$comment) {
        echo json_encode([
            'success' => false,
            'message' => 'Comentario no encontrado'
        ]);
        exit();
    }

    if ($comment['usuario_id'] != $usuarioId) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'No tienes permiso para editar este comentario'
        ]);
        exit();
    }

    $stmt = $pdo->prepare("
        UPDATE comentarios
        SET contenido = ?
        WHERE id = ?
    ");
    $stmt->execute([$contenido, $comentarioId]);

    echo json_encode([
        'success' => true,
        'message' => 'Comentario actualizado correctamente'
    ]);
} catch (PDOException $e) {
    error_log('Error al actualizar comentario: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo actualizar el comentario'
    ]);
}
?>