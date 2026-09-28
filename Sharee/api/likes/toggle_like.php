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
        'message' => 'Debes iniciar sesión para dar me gusta'
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
    $check = $pdo->prepare("
        SELECT 1
        FROM likes
        WHERE usuario_id = ? AND publicacion_id = ?
    ");
    $check->execute([$usuarioId, $publicacionId]);

    if ($check->fetch()) {
        $delete = $pdo->prepare("
            DELETE FROM likes
            WHERE usuario_id = ? AND publicacion_id = ?
        ");
        $delete->execute([$usuarioId, $publicacionId]);

        $liked = false;
    } else {
        $insert = $pdo->prepare("
            INSERT INTO likes (usuario_id, publicacion_id)
            VALUES (?, ?)
        ");
        $insert->execute([$usuarioId, $publicacionId]);

        $liked = true;
    }

    $countStmt = $pdo->prepare("
        SELECT COUNT(*) AS total
        FROM likes
        WHERE publicacion_id = ?
    ");
    $countStmt->execute([$publicacionId]);
    $totalLikes = (int)$countStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'liked' => $liked,
        'likes_count' => $totalLikes,
        'message' => $liked ? 'Like agregado' : 'Like quitado'
    ]);
} catch (PDOException $e) {
    error_log('Error al alternar like: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo actualizar el like'
    ]);
}
?>