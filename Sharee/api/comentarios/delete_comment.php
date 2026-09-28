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

$comentarioId = (int)($data['comentario_id'] ?? 0);

if ($comentarioId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Comentario inválido'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        DELETE FROM comentarios
        WHERE id = ? AND usuario_id = ?
    ");
    $stmt->execute([$comentarioId, $usuarioId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Comentario eliminado'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No podés eliminar este comentario'
        ]);
    }
} catch (PDOException $e) {
    error_log('Error al eliminar comentario: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo eliminar el comentario'
    ]);
}
?>