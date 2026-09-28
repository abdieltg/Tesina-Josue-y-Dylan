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
        'message' => 'Debes iniciar sesión para publicar'
    ]);
    exit();
}

$usuarioId = obtenerUsuarioAutenticado();

$contenido = trim($_POST['contenido'] ?? '');
$hashtagsTexto = trim($_POST['hashtags'] ?? '');

$archivo = $_FILES['imagen'] ?? null;

if ($contenido === '' && !$archivo) {
    echo json_encode([
        'success' => false,
        'message' => 'La publicación debe tener texto o una imagen'
    ]);
    exit();
}

if (strlen($contenido) > 500) {
    echo json_encode([
        'success' => false,
        'message' => 'La publicación supera el máximo permitido'
    ]);
    exit();
}

$limiteBytes = 5 * 1024 * 1024;
$imagenUrl = null;
$rutaImagenFisica = null;

try {
    /*
     * Validar imagen si fue enviada
     */
    if ($archivo && $archivo['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($archivo['error'] !== UPLOAD_ERR_OK) {
            echo json_encode([
                'success' => false,
                'message' => 'No se pudo subir la imagen'
            ]);
            exit();
        }

        if ($archivo['size'] > $limiteBytes) {
            echo json_encode([
                'success' => false,
                'message' => 'La imagen no puede superar los 5 MB'
            ]);
            exit();
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeReal = $finfo->file($archivo['tmp_name']);

        $tiposPermitidos = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp'
        ];

        if (!array_key_exists($mimeReal, $tiposPermitidos)) {
            echo json_encode([
                'success' => false,
                'message' => 'Solo se permiten imágenes JPG, PNG o WEBP'
            ]);
            exit();
        }

        if (@getimagesize($archivo['tmp_name']) === false) {
            echo json_encode([
                'success' => false,
                'message' => 'El archivo no es una imagen válida'
            ]);
            exit();
        }

        $directorioFisico = __DIR__ . '/../../uploads/posts/';
        $directorioPublico = 'uploads/posts/';

        if (!is_dir($directorioFisico)) {
            mkdir($directorioFisico, 0755, true);
        }

        $extension = $tiposPermitidos[$mimeReal];
        $nombreArchivo = bin2hex(random_bytes(16)) . '.' . $extension;

        $rutaImagenFisica = $directorioFisico . $nombreArchivo;
        $imagenUrl = $directorioPublico . $nombreArchivo;

        if (!move_uploaded_file($archivo['tmp_name'], $rutaImagenFisica)) {
            echo json_encode([
                'success' => false,
                'message' => 'No se pudo guardar la imagen'
            ]);
            exit();
        }
    }

    /*
     * Combinar los hashtags con el contenido.
     */
    $contenidoFinal = $contenido;

    if ($hashtagsTexto !== '') {
        $contenidoFinal .= ($contenidoFinal !== '' ? ' ' : '') . $hashtagsTexto;
    }

    $hashtags = [];

    preg_match_all(
        '/#([a-zA-Z0-9_]+)/',
        $contenidoFinal,
        $matches
    );

    if (!empty($matches[1])) {
        $hashtags = array_values(array_unique($matches[1]));
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO publicaciones
            (usuario_id, contenido, imagen_url)
        VALUES (?, ?, ?)
    ");

    $stmt->execute([
        $usuarioId,
        $contenidoFinal,
        $imagenUrl
    ]);

    $publicacionId = $pdo->lastInsertId();

    foreach ($hashtags as $tag) {
        $stmtHash = $pdo->prepare("
            SELECT id
            FROM hashtags
            WHERE nombre = ?
        ");

        $stmtHash->execute([$tag]);
        $hashtagId = $stmtHash->fetchColumn();

        if (!$hashtagId) {
            $insertHash = $pdo->prepare("
                INSERT INTO hashtags (nombre)
                VALUES (?)
            ");

            $insertHash->execute([$tag]);
            $hashtagId = $pdo->lastInsertId();
        }

        $stmtRelacion = $pdo->prepare("
            INSERT INTO publicacion_hashtags
                (publicacion_id, hashtag_id)
            VALUES (?, ?)
        ");

        $stmtRelacion->execute([
            $publicacionId,
            $hashtagId
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Publicación creada correctamente',
        'data' => [
            'id' => (int)$publicacionId,
            'imagen_url' => $imagenUrl
        ]
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($rutaImagenFisica && is_file($rutaImagenFisica)) {
        unlink($rutaImagenFisica);
    }

    error_log('Error al crear publicación: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo crear la publicación'
    ]);
}
?>