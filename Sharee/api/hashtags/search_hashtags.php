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

$termino = trim($_GET['q'] ?? '');

if ($termino === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Debes ingresar un hashtag'
    ]);
    exit();
}

$terminoNormalizado = ltrim($termino, '#');
$terminoLike = '%' . $terminoNormalizado . '%';

try {
    $stmt = $pdo->prepare("
        SELECT h.id, h.nombre, COUNT(ph.publicacion_id) AS cantidad_publicaciones
        FROM hashtags h
        LEFT JOIN publicacion_hashtags ph ON ph.hashtag_id = h.id
        WHERE h.nombre LIKE ?
        GROUP BY h.id, h.nombre
        ORDER BY cantidad_publicaciones DESC, h.nombre ASC
        LIMIT 10
    ");

    $stmt->execute([$terminoLike]);
    $hashtags = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Búsqueda de hashtags realizada',
        'data' => $hashtags
    ]);
} catch (PDOException $e) {
    error_log('Error al buscar hashtags: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo buscar hashtags'
    ]);
}
?>