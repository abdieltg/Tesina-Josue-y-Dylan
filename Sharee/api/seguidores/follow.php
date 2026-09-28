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
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data === null) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos'
    ]);
    exit();
}

$seguidoId = (int)($data['seguido_id'] ?? 0);

if ($seguidoId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuario inválido'
    ]);
    exit();
}

if ($usuarioActualId === $seguidoId) {
    echo json_encode([
        'success' => false,
        'message' => 'No podés seguirte a vos mismo'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT 1
        FROM seguimientos
        WHERE seguidor_id = ? AND seguido_id = ?
    ");
    $stmt->execute([$usuarioActualId, $seguidoId]);

    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Ya estás siguiendo a este usuario'
        ]);
        exit();
    }

    $insert = $pdo->prepare("
        INSERT INTO seguimientos (seguidor_id, seguido_id)
        VALUES (?, ?)
    ");
    $insert->execute([$usuarioActualId, $seguidoId]);

    echo json_encode([
        'success' => true,
        'message' => 'Usuario seguido correctamente'
    ]);
} catch (PDOException $e) {
    error_log('Error al seguir usuario: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo seguir al usuario'
    ]);
}
?>