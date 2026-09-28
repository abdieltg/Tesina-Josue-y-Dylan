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

if ($usuarioId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuario inválido'
    ]);
    exit();
}

try {
    $sql = "
        SELECT
            p.id,
            p.usuario_id,
            u.nombre,
            u.apellido,
            u.username,
            u.avatar_url,
            p.contenido,
            p.created_at,
            COUNT(DISTINCT l.usuario_id) AS likes_count,
            COUNT(DISTINCT c.id) AS comments_count
        FROM publicaciones p
        INNER JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN likes l ON l.publicacion_id = p.id
        LEFT JOIN comentarios c ON c.publicacion_id = p.id
        WHERE p.usuario_id = ?
        GROUP BY p.id, p.usuario_id, u.nombre, u.apellido, u.username, u.avatar_url, p.contenido, p.created_at
        ORDER BY p.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuarioId]);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $resultado = [];

    foreach ($posts as $post) {
        $postId = (int)$post['id'];

        $hashtagStmt = $pdo->prepare("
            SELECT h.nombre
            FROM publicacion_hashtags ph
            INNER JOIN hashtags h ON h.id = ph.hashtag_id
            WHERE ph.publicacion_id = :publicacion_id
            ORDER BY h.nombre ASC
        ");
        $hashtagStmt->execute([':publicacion_id' => $postId]);
        $hashtags = $hashtagStmt->fetchAll(PDO::FETCH_COLUMN);

        $resultado[] = [
            'id' => $postId,
            'usuario_id' => (int)$post['usuario_id'],
            'nombre' => $post['nombre'],
            'apellido' => $post['apellido'],
            'username' => $post['username'],
            'avatar_url' => $post['avatar_url'],
            'contenido' => $post['contenido'],
            'created_at' => $post['created_at'],
            'likes_count' => (int)$post['likes_count'],
            'comments_count' => (int)$post['comments_count'],
            'hashtags' => $hashtags
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $resultado
    ]);
} catch (PDOException $e) {
    error_log('Error al cargar publicaciones del usuario: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar publicaciones'
    ]);
}
?>