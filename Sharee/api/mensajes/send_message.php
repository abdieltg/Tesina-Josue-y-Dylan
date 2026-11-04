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

$usuarioActualId = obtenerUsuarioAutenticado();

$rawBody = file_get_contents('php://input');
$data = [];

if (trim($rawBody) !== '') {
    $decoded = json_decode($rawBody, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $data = $decoded;
    }
}

$receptorId = (int)($_POST['receptor_id'] ?? $data['receptor_id'] ?? $data['destinatario_id'] ?? 0);
$contenido = trim((string)($_POST['contenido'] ?? $data['contenido'] ?? ''));
$archivo = $_FILES['imagen'] ?? null;

if ($receptorId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuario inválido'
    ]);
    exit();
}

if ($usuarioActualId === $receptorId) {
    echo json_encode([
        'success' => false,
        'message' => 'No te podés enviar mensajes a vos mismo'
    ]);
    exit();
}

if ($contenido === '' && !$archivo) {
    echo json_encode([
        'success' => false,
        'message' => 'Escribí un mensaje o adjuntá una imagen'
    ]);
    exit();
}

if (strlen($contenido) > 1000) {
    echo json_encode([
        'success' => false,
        'message' => 'El mensaje supera el máximo permitido'
    ]);
    exit();
}

$imagenUrl = null;

if ($archivo && $archivo['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($archivo['error'] !== UPLOAD_ERR_OK) {
        echo json_encode([
            'success' => false,
            'message' => 'No se pudo subir la imagen'
        ]);
        exit();
    }

    if ($archivo['size'] > 5 * 1024 * 1024) {
        echo json_encode([
            'success' => false,
            'message' => 'La imagen no puede superar 5 MB'
        ]);
        exit();
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($archivo['tmp_name']);

    $permitidos = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ];

    if (!isset($permitidos[$mime])) {
        echo json_encode([
            'success' => false,
            'message' => 'Solo se permiten JPG, PNG o WEBP'
        ]);
        exit();
    }

    $directorio = __DIR__ . '/../../uploads/mensajes/';
    if (!is_dir($directorio)) {
        mkdir($directorio, 0755, true);
    }

    $nombre = bin2hex(random_bytes(12)) . '.' . $permitidos[$mime];
    $rutaFisica = $directorio . $nombre;
    $rutaPublica = 'uploads/mensajes/' . $nombre;

    if (!move_uploaded_file($archivo['tmp_name'], $rutaFisica)) {
        echo json_encode([
            'success' => false,
            'message' => 'No se pudo guardar la imagen'
        ]);
        exit();
    }

    $imagenUrl = $rutaPublica;
}

// Verificar si ambos se siguen
$stmt = $pdo->prepare("
    SELECT 1
    FROM seguimientos
    WHERE (seguidor_id = ? AND seguido_id = ?)
       OR (seguidor_id = ? AND seguido_id = ?)
    LIMIT 1
");
$stmt->execute([$usuarioActualId, $receptorId, $receptorId, $usuarioActualId]);

if (!$stmt->fetch()) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Solo podés enviar mensajes a usuarios que te sigan y a los que sigas'
    ]);
    exit();
}

// Buscar o crear conversación
$stmt = $pdo->prepare("
    SELECT id
    FROM conversaciones
    WHERE (usuario1_id = ? AND usuario2_id = ?)
       OR (usuario1_id = ? AND usuario2_id = ?)
    LIMIT 1
");
$stmt->execute([$usuarioActualId, $receptorId, $receptorId, $usuarioActualId]);
$conv = $stmt->fetch(PDO::FETCH_ASSOC);

if ($conv) {
    $conversacionId = (int)$conv['id'];
} else {
    $stmt = $pdo->prepare("
        INSERT INTO conversaciones (usuario1_id, usuario2_id)
        VALUES (?, ?)
    ");
    $stmt->execute([$usuarioActualId, $receptorId]);
    $conversacionId = (int)$pdo->lastInsertId();
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO mensajes (conversacion_id, remitente_id, contenido, imagen_url, leido)
        VALUES (?, ?, ?, ?, 0)
    ");
    $stmt->execute([
        $conversacionId,
        $usuarioActualId,
        $contenido !== '' ? $contenido : null,
        $imagenUrl
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Mensaje enviado correctamente'
    ]);
} catch (PDOException $e) {
    error_log('Error al enviar mensaje: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'No se puede enviar el mensaje'
    ]);
}
?>