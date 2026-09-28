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
        'message' => 'Debes iniciar sesión para comentar'
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
    $stmt = $pdo->prepare("
        INSERT INTO comentarios (publicacion_id, usuario_id, contenido)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$publicacionId, $usuarioId, $contenido]);

    echo json_encode([
        'success' => true,
        'message' => 'Comentario agregado correctamente'
    ]);
} catch (PDOException $e) {
    error_log('Error al crear comentario: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo crear el comentario'
    ]);
}
?>