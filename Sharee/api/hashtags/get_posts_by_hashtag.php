<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once dirname(__DIR__) . '/conexion.php';
require_once dirname(__DIR__) . '/sesion.php';

header('Content-Type: application/json; charset=utf-8');

function responderHashtag(int $status, array $contenido): void
{
    http_response_code($status);
    echo json_encode(
        $contenido,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responderHashtag(405, [
        'success' => false,
        'message' => 'Método no permitido.',
    ]);
}

if (!estaAutenticado()) {
    responderHashtag(401, [
        'success' => false,
        'message' => 'Debes iniciar sesión para ver publicaciones.',
    ]);
}

$hashtag = trim((string) ($_GET['tag'] ?? ''));
$hashtag = ltrim($hashtag, '#');

if ($hashtag === '' || strlen($hashtag) > 100) {
    responderHashtag(422, [
        'success' => false,
        'message' => 'El hashtag no es válido.',
    ]);
}

try {
    $stmt = $pdo->prepare(
        'SELECT
            p.id,
            p.usuario_id,
            p.contenido,
            p.imagen_url,
            p.created_at,
            u.nombre,
            u.apellido,
            u.username,
            u.avatar_url,
            (SELECT COUNT(*)
             FROM likes l
             WHERE l.publicacion_id = p.id) AS likes_count,
            (SELECT COUNT(*)
             FROM comentarios c
             WHERE c.publicacion_id = p.id) AS comments_count
         FROM hashtags h
         INNER JOIN publicacion_hashtags ph
             ON ph.hashtag_id = h.id
         INNER JOIN publicaciones p
             ON p.id = ph.publicacion_id
         INNER JOIN usuarios u
             ON u.id = p.usuario_id
         WHERE LOWER(h.nombre) = LOWER(?)
         ORDER BY p.created_at DESC
         LIMIT 50'
    );

    $stmt->execute([$hashtag]);
    $publicaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($publicaciones as &$publicacion) {
        $publicacion['id'] = (int) $publicacion['id'];
        $publicacion['usuario_id'] = (int) $publicacion['usuario_id'];
        $publicacion['likes_count'] = (int) $publicacion['likes_count'];
        $publicacion['comments_count'] = (int) $publicacion['comments_count'];
    }
    unset($publicacion);

    responderHashtag(200, [
        'success' => true,
        'hashtag' => $hashtag,
        'data' => $publicaciones,
    ]);
} catch (Throwable $e) {
    error_log(
        'Error al cargar publicaciones por hashtag: ' .
        $e->getMessage() .
        ' en ' . $e->getFile() .
        ':' . $e->getLine()
    );

    responderHashtag(500, [
        'success' => false,
        'message' => 'No se pudieron cargar las publicaciones de ese hashtag.',
    ]);
}