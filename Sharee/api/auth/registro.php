<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

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

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data === null) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos',
        'debug' => 'No se pudo leer el JSON del request'
    ]);
    exit();
}

$response = [
    'success' => false,
    'message' => '',
    'errors' => []
];

$nombre = trim($data['nombre'] ?? '');
$apellido = trim($data['apellido'] ?? '');
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$passwordConfirm = $data['passwordConfirm'] ?? '';

if (empty($nombre)) {
    $response['errors']['nombre'] = 'El nombre es obligatorio';
}

if (empty($apellido)) {
    $response['errors']['apellido'] = 'El apellido es obligatorio';
}

if (empty($username)) {
    $response['errors']['username'] = 'El nombre de usuario es obligatorio';
} elseif (strlen($username) < 3) {
    $response['errors']['username'] = 'El nombre de usuario debe tener al menos 3 caracteres';
} elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    $response['errors']['username'] = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
}

if (empty($email)) {
    $response['errors']['email'] = 'El email es obligatorio';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $response['errors']['email'] = 'El email no es válido';
} elseif (substr($email, -20) !== '@escuelasproa.edu.ar') {
    $response['errors']['email'] = 'Debes usar un email institucional (@escuelasproa.edu.ar)';
}

if (empty($password)) {
    $response['errors']['password'] = 'La contraseña es obligatoria';
} elseif (strlen($password) < 6) {
    $response['errors']['password'] = 'La contraseña debe tener al menos 6 caracteres';
}

if (empty($passwordConfirm)) {
    $response['errors']['passwordConfirm'] = 'Debes confirmar la contraseña';
} elseif ($password !== $passwordConfirm) {
    $response['errors']['passwordConfirm'] = 'Las contraseñas no coinciden';
}

if (!empty($response['errors'])) {
    $response['message'] = 'Por favor, corrige los errores';
    echo json_encode($response);
    exit();
}

try {
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        $response['errors']['email'] = 'Este email ya está registrado';
        $response['message'] = 'El email ya está en uso';
        echo json_encode($response);
        exit();
    }
} catch (PDOException $e) {
    error_log('Error verificacion email: ' . $e->getMessage());
    $response['message'] = 'Error al verificar el email';
    echo json_encode($response);
    exit();
}

try {
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE username = ?');
    $stmt->execute([$username]);

    if ($stmt->fetch()) {
        $response['errors']['username'] = 'Este nombre de usuario ya está en uso';
        $response['message'] = 'El nombre de usuario no está disponible';
        echo json_encode($response);
        exit();
    }
} catch (PDOException $e) {
    error_log('Error verificacion username: ' . $e->getMessage());
    $response['message'] = 'Error al verificar el nombre de usuario';
    echo json_encode($response);
    exit();
}

try {
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare(
        'INSERT INTO usuarios (nombre, apellido, username, email, password)
         VALUES (?, ?, ?, ?, ?)'
    );

    $stmt->execute([$nombre, $apellido, $username, $email, $passwordHash]);

    $response['success'] = true;
    $response['message'] = 'Registro exitoso. Ahora puedes iniciar sesión.';
} catch (PDOException $e) {
    error_log('Error al crear usuario: ' . $e->getMessage());
    $response['message'] = 'Error al crear la cuenta. Intenta nuevamente.';
}

echo json_encode($response);
?>