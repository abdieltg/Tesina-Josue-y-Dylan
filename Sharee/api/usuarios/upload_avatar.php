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

if (!isset($_FILES['avatar'])) {
    echo json_encode([
        'success' => false,
        'message' => 'No se recibió ningún archivo'
    ]);

    exit();
}

$archivo = $_FILES['avatar'];

if ($archivo['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo subir el archivo'
    ]);

    exit();
}

$limiteBytes = 2 * 1024 * 1024;

if ($archivo['size'] > $limiteBytes) {
    echo json_encode([
        'success' => false,
        'message' => 'El avatar no puede superar los 2 MB'
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

$usuarioId = obtenerUsuarioAutenticado();
$extension = $tiposPermitidos[$mimeReal];
$nombreArchivo = bin2hex(random_bytes(16)) . '.' . $extension;

$directorioRelativo = '../../uploads/avatars/';
$directorioFisico = __DIR__ . '/../../uploads/avatars/';

if (!is_dir($directorioFisico)) {
    mkdir($directorioFisico, 0755, true);
}

$rutaFisica = $directorioFisico . $nombreArchivo;
$rutaPublica = 'uploads/avatars/' . $nombreArchivo;

try {
    $stmt = $pdo->prepare(
        'SELECT avatar_url
         FROM usuarios
         WHERE id = ?
         LIMIT 1'
    );

    $stmt->execute([$usuarioId]);
    $usuario = $stmt->fetch();

    if (!move_uploaded_file($archivo['tmp_name'], $rutaFisica)) {
        echo json_encode([
            'success' => false,
            'message' => 'No se pudo guardar el avatar'
        ]);

        exit();
    }

    $stmt = $pdo->prepare(
        'UPDATE usuarios
         SET avatar_url = ?
         WHERE id = ?'
    );

    $stmt->execute([$rutaPublica, $usuarioId]);

    if (!empty($usuario['avatar_url'])) {
        $avatarAnterior = __DIR__ . '/../../' . $usuario['avatar_url'];

        if (is_file($avatarAnterior)) {
            unlink($avatarAnterior);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Avatar actualizado correctamente',
        'data' => [
            'avatar_url' => $rutaPublica
        ]
    ]);
} catch (PDOException $e) {
    if (is_file($rutaFisica)) {
        unlink($rutaFisica);
    }

    error_log('Error al subir avatar: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo actualizar el avatar'
    ]);
}