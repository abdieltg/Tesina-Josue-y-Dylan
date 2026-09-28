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

$publicacionId = (int)($data['publicacion_id'] ?? 0);
$contenido = trim($data['contenido'] ?? '');

if ($publicacionId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Publicación inválida'
    ]);
    exit();
}

if ($contenido === '') {
    echo json_encode([
        'success' => false,
        'message' => 'La publicación no puede estar vacía'
    ]);
    exit();
}

if (strlen($contenido) > 500) {
    echo json_encode([
        'success' => false,
        'message' => 'La publicación supera el máximo permitido'
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
            'message' => 'No tienes permiso para editar esta publicación'
        ]);
        exit();
    }

    // Extraer hashtags
    $hashtags = [];
    preg_match_all('/#([a-zA-Z0-9_]+)/', $contenido, $matches);

    if (!empty($matches[1])) {
        $hashtags = array_values(array_unique($matches[1]));
    }

    $pdo->beginTransaction();

    // Actualizar publicación
    $updateStmt = $pdo->prepare("
        UPDATE publicaciones
        SET contenido = ?
        WHERE id = ?
    ");
    $updateStmt->execute([$contenido, $publicacionId]);

    // Eliminar hashtags anteriores
    $deleteHashtags = $pdo->prepare("
        DELETE FROM publicacion_hashtags WHERE publicacion_id = ?
    ");
    $deleteHashtags->execute([$publicacionId]);

    // Agregar nuevos hashtags
    foreach ($hashtags as $tag) {
        $tag = trim($tag);

        $stmtHash = $pdo->prepare("
            SELECT id FROM hashtags WHERE nombre = ?
        ");
        $stmtHash->execute([$tag]);

        $hashtagId = $stmtHash->fetchColumn();

        if (!$hashtagId) {
            $insertHash = $pdo->prepare("
                INSERT INTO hashtags (nombre)
                VALUES (?)
            ");
            $insertHash->execute([$tag]);
            $hashtagId = $pdo->lastInsertId();
        }

        $stmtRelacion = $pdo->prepare("
            INSERT INTO publicacion_hashtags (publicacion_id, hashtag_id)
            VALUES (?, ?)
        ");
        $stmtRelacion->execute([$publicacionId, $hashtagId]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Publicación actualizada correctamente'
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Error al actualizar publicación: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo actualizar la publicación'
    ]);
}
?>