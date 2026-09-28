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

$nombre = trim($data['nombre'] ?? '');
$apellido = trim($data['apellido'] ?? '');
$username = trim($data['username'] ?? '');
$bio = trim($data['bio'] ?? '');

$errors = [];

if ($nombre === '') {
    $errors['nombre'] = 'El nombre es obligatorio';
} elseif (mb_strlen($nombre) > 100) {
    $errors['nombre'] = 'El nombre no puede superar los 100 caracteres';
}

if ($apellido === '') {
    $errors['apellido'] = 'El apellido es obligatorio';
} elseif (mb_strlen($apellido) > 100) {
    $errors['apellido'] = 'El apellido no puede superar los 100 caracteres';
}

if ($username === '') {
    $errors['username'] = 'El nombre de usuario es obligatorio';
} elseif (mb_strlen($username) < 3) {
    $errors['username'] = 'El nombre de usuario debe tener al menos 3 caracteres';
} elseif (mb_strlen($username) > 50) {
    $errors['username'] = 'El nombre de usuario no puede superar los 50 caracteres';
} elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    $errors['username'] = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
}

if (mb_strlen($bio) > 500) {
    $errors['bio'] = 'La biografía no puede superar los 500 caracteres';
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
        'SELECT id
         FROM usuarios
         WHERE username = ?
           AND id != ?
         LIMIT 1'
    );

    $stmt->execute([$username, $usuarioId]);

    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'El nombre de usuario ya está en uso',
            'errors' => [
                'username' => 'Elegí otro nombre de usuario'
            ]
        ]);

        exit();
    }

    $stmt = $pdo->prepare(
        'UPDATE usuarios
         SET nombre = ?,
             apellido = ?,
             username = ?,
             bio = ?
         WHERE id = ?'
    );

    $stmt->execute([
        $nombre,
        $apellido,
        $username,
        $bio !== '' ? $bio : null,
        $usuarioId
    ]);

    $_SESSION['username'] = $username;

    echo json_encode([
        'success' => true,
        'message' => 'Perfil actualizado correctamente'
    ]);
} catch (PDOException $e) {
    error_log('Error al actualizar perfil: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'No se pudo actualizar el perfil'
    ]);
}