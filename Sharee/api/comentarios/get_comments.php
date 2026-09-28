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

$usuarioActualId = obtenerUsuarioAutenticado();
$publicacionId = (int)($_GET['publicacion_id'] ?? 0);

if ($publicacionId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Publicación inválida'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT
            c.id,
            c.publicacion_id,
            c.usuario_id,
            u.username,
            u.avatar_url,
            c.contenido,
            c.created_at
        FROM comentarios c
        INNER JOIN usuarios u ON u.id = c.usuario_id
        WHERE c.publicacion_id = ?
        ORDER BY c.created_at ASC
    ");
    $stmt->execute([$publicacionId]);

    $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Agregar is_owner a cada comentario
    $comentarios = array_map(function($c) use ($usuarioActualId) {
        $c['is_owner'] = (int)$c['usuario_id'] === $usuarioActualId;
        return $c;
    }, $comentarios);

    echo json_encode([
        'success' => true,
        'message' => 'Comentarios cargados correctamente',
        'data' => $comentarios
    ]);
} catch (PDOException $e) {
    error_log('Error al obtener comentarios: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudieron cargar los comentarios'
    ]);
}
?>