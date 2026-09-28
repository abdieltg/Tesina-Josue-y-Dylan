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
$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos'
    ]);

    exit();
}

$passwordActual = $data['password_actual'] ?? '';
$passwordNueva = $data['password_nueva'] ?? '';
$passwordConfirmacion = $data['password_confirmacion'] ?? '';

$errors = [];

if ($passwordActual === '') {
    $errors['password_actual'] = 'Ingresá tu contraseña actual';
}

if ($passwordNueva === '') {
    $errors['password_nueva'] = 'Ingresá una nueva contraseña';
} elseif (strlen($passwordNueva) < 6) {
    $errors['password_nueva'] = 'La nueva contraseña debe tener al menos 6 caracteres';
}

if ($passwordConfirmacion === '') {
    $errors['password_confirmacion'] = 'Confirmá la nueva contraseña';
} elseif ($passwordNueva !== $passwordConfirmacion) {
    $errors['password_confirmacion'] = 'Las contraseñas no coinciden';
}

if (!empty($errors)) {
    echo json_encode([
        'success' => false,
        'message' => 'Revisá los datos ingresados',
        'errors' => $errors
    ]);

    exit();
}

try {
    $stmt = $pdo->prepare(
        'SELECT password
         FROM usuarios
         WHERE id = ?
         LIMIT 1'
    );

    $stmt->execute([$usuarioId]);
    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($passwordActual, $usuario['password'])) {
        echo json_encode([
            'success' => false,
            'message' => 'La contraseña actual es incorrecta'
        ]);

        exit();
    }

    $nuevoHash = password_hash($passwordNueva, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'UPDATE usuarios
         SET password = ?
         WHERE id = ?'
    );

    $stmt->execute([$nuevoHash, $usuarioId]);

    echo json_encode([
        'success' => true,
        'message' => 'Contraseña actualizada correctamente'
    ]);
} catch (PDOException $e) {
    error_log('Error al cambiar contraseña: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo cambiar la contraseña'
    ]);
}