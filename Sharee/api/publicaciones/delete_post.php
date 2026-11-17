<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once '../conexion.php';
require_once '../sesion.php';

header('Content-Type: application/json; charset=utf-8');

function responderEliminarPublicacion(int $status, array $contenido): void
{
    http_response_code($status);
    echo json_encode(
        $contenido,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderEliminarPublicacion(405, [
        'success' => false,
        'message' => 'Método no permitido.',
    ]);
}

if (!estaAutenticado()) {
    responderEliminarPublicacion(401, [
        'success' => false,
        'message' => 'Debes iniciar sesión.',
    ]);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    responderEliminarPublicacion(400, [
        'success' => false,
        'message' => 'Datos inválidos.',
    ]);
}

$publicacionId = filter_var(
    $data['publicacion_id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);

if (!$publicacionId) {
    responderEliminarPublicacion(422, [
        'success' => false,
        'message' => 'Publicación inválida.',
    ]);
}

$usuarioId = (int) obtenerUsuarioAutenticado();

try {
    $stmt = $pdo->prepare(
        'SELECT role FROM usuarios WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$usuarioId]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        responderEliminarPublicacion(401, [
            'success' => false,
            'message' => 'La cuenta ya no existe.',
        ]);
    }

    $esAdmin = $usuario['role'] === 'admin';

    $stmt = $pdo->prepare(
        'SELECT id, usuario_id
         FROM publicaciones
         WHERE id = ?
         LIMIT 1'
    );
    $stmt->execute([$publicacionId]);
    $publicacion = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$publicacion) {
        responderEliminarPublicacion(404, [
            'success' => false,
            'message' => 'Publicación no encontrada.',
        ]);
    }

    if (!$esAdmin && (int) $publicacion['usuario_id'] !== $usuarioId) {
        responderEliminarPublicacion(403, [
            'success' => false,
            'message' => 'Solo puedes eliminar tus propias publicaciones.',
        ]);
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('DELETE FROM likes WHERE publicacion_id = ?');
    $stmt->execute([$publicacionId]);

    $stmt = $pdo->prepare('DELETE FROM comentarios WHERE publicacion_id = ?');
    $stmt->execute([$publicacionId]);

    $stmt = $pdo->prepare(
        'DELETE FROM publicacion_hashtags WHERE publicacion_id = ?'
    );
    $stmt->execute([$publicacionId]);

    $stmt = $pdo->prepare('DELETE FROM publicaciones WHERE id = ?');
    $stmt->execute([$publicacionId]);

    $pdo->commit();

    responderEliminarPublicacion(200, [
        'success' => true,
        'message' => 'Publicación eliminada correctamente.',
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        'Error al eliminar publicación: ' .
        $e->getMessage() .
        ' en ' . $e->getFile() .
        ':' . $e->getLine()
    );

    responderEliminarPublicacion(500, [
        'success' => false,
        'message' => 'No se pudo eliminar la publicación.',
    ]);
}