<?php
require_once '../conexion.php';
require_once '../sesion.php';

header('Content-Type: application/json; charset=utf-8');

if (!estaAutenticado()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Debes iniciar sesión para ver publicaciones'
    ]);
    exit();
}

$usuarioActualId = obtenerUsuarioAutenticado();

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
            p.imagen_url,
            p.created_at,
            COUNT(DISTINCT l.usuario_id) AS likes_count,
            COUNT(DISTINCT c.id) AS comments_count,
            MAX(CASE WHEN l2.usuario_id = :usuario_actual THEN 1 ELSE 0 END) AS is_liked
        FROM publicaciones p
        INNER JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN likes l ON l.publicacion_id = p.id
        LEFT JOIN comentarios c ON c.publicacion_id = p.id
        LEFT JOIN likes l2 ON l2.publicacion_id = p.id
        GROUP BY p.id, p.usuario_id, u.nombre, u.apellido, u.username, p.imagen_url, u.avatar_url, p.contenido, p.created_at
        ORDER BY p.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':usuario_actual', $usuarioActualId, PDO::PARAM_INT);
    $stmt->execute();

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
            'id' => (int)$post['id'],
            'usuario_id' => (int)$post['usuario_id'],
            'nombre' => $post['nombre'],
            'apellido' => $post['apellido'],
            'username' => $post['username'],
            'imagen_url' => $post['imagen_url'],
            'avatar_url' => $post['avatar_url'],
            'contenido' => $post['contenido'],
            'created_at' => $post['created_at'],
            'likes_count' => (int)$post['likes_count'],
            'comments_count' => (int)$post['comments_count'],
            'is_liked' => (int)$post['is_liked'] === 1,
            'is_owner' => (int)$post['usuario_id'] === $usuarioActualId, // AGREGADO
            'hashtags' => $hashtags
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Publicaciones cargadas correctamente',
        'data' => $resultado
    ]);
} catch (PDOException $e) {
    error_log('Error al cargar publicaciones: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudieron cargar las publicaciones'
    ]);
}
?>