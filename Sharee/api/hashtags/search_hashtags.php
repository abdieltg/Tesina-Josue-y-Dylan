<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once dirname(__DIR__) . '/conexion.php';
require_once dirname(__DIR__) . '/sesion.php';

header('Content-Type: application/json; charset=utf-8');

function responderBusquedaHashtag(int $status, array $contenido): void
{
    http_response_code($status);
    echo json_encode(
        $contenido,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responderBusquedaHashtag(405, [
        'success' => false,
        'message' => 'Método no permitido.',
    ]);
}

if (!estaAutenticado()) {
    responderBusquedaHashtag(401, [
        'success' => false,
        'message' => 'Debes iniciar sesión.',
    ]);
}

$termino = trim((string) ($_GET['q'] ?? ''));
$termino = ltrim($termino, '#');

if ($termino === '') {
    responderBusquedaHashtag(422, [
        'success' => false,
        'message' => 'Ingresa un hashtag para buscar.',
    ]);
}

if (strlen($termino) > 100) {
    $termino = substr($termino, 0, 100);
}

try {
    $stmt = $pdo->prepare(
        'SELECT
            h.id,
            h.nombre,
            COUNT(DISTINCT ph.publicacion_id) AS cantidad_publicaciones
         FROM hashtags h
         LEFT JOIN publicacion_hashtags ph
             ON ph.hashtag_id = h.id
         WHERE h.nombre LIKE ?
         GROUP BY h.id, h.nombre
         ORDER BY cantidad_publicaciones DESC, h.nombre ASC
         LIMIT 20'
    );

    $stmt->execute(['%' . $termino . '%']);
    $hashtags = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($hashtags as &$hashtag) {
        $hashtag['id'] = (int) $hashtag['id'];
        $hashtag['cantidad_publicaciones'] =
            (int) $hashtag['cantidad_publicaciones'];
    }
    unset($hashtag);

    responderBusquedaHashtag(200, [
        'success' => true,
        'data' => $hashtags,
    ]);
} catch (Throwable $e) {
    error_log(
        'Error buscando hashtags: ' .
        $e->getMessage() .
        ' en ' . $e->getFile() .
        ':' . $e->getLine()
    );

    responderBusquedaHashtag(500, [
        'success' => false,
        'message' => 'No se pudieron buscar hashtags.',
    ]);
}