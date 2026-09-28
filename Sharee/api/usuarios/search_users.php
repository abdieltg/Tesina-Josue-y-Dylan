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
        'message' => 'Debes ingresar un término de búsqueda'
    ]);
    exit();
}

$terminoLike = '%' . $termino . '%';

try {
    $stmt = $pdo->prepare("
        SELECT id, nombre, apellido, username, avatar_url, bio
        FROM usuarios
        WHERE username LIKE ?
           OR nombre LIKE ?
           OR apellido LIKE ?
        ORDER BY username ASC
        LIMIT 10
    ");

    $stmt->execute([$terminoLike, $terminoLike, $terminoLike]);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Búsqueda de usuarios realizada',
        'data' => $usuarios
    ]);
} catch (PDOException $e) {
    error_log('Error al buscar usuarios: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo realizar la búsqueda'
    ]);
}
?>