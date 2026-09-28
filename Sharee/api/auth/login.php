<?php
require_once '../conexion.php';
require_once '../sesion.php';

// Solo aceptar peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Obtener datos del request
$data = json_decode(file_get_contents('php://input'), true);

$response = [
    'success' => false,
    'message' => '',
    'errors' => []
];

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Validar campos
if (empty($email)) {
    $response['errors']['email'] = 'El email es obligatorio';
}

if (empty($password)) {
    $response['errors']['password'] = 'La contraseña es obligatoria';
}

if (!empty($response['errors'])) {
    $response['message'] = 'Por favor, completa todos los campos';
    echo json_encode($response);
    exit();
}

// Buscar usuario por email
try {
    $stmt = $pdo->prepare('SELECT id, email, username, password FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();
    
    if (!$usuario) {
        // No revelar si el email existe o no por seguridad
        $response['message'] = 'Email o contraseña incorrectos';
        echo json_encode($response);
        exit();
    }
    
    // Verificar contraseña
    if (!password_verify($password, $usuario['password'])) {
        $response['message'] = 'Email o contraseña incorrectos';
        echo json_encode($response);
        exit();
    }
    
    // Iniciar sesión
    iniciarSesionUsuario($usuario['id'], $usuario['email'], $usuario['username']);
    
    $response['success'] = true;
    $response['message'] = 'Sesión iniciada correctamente';
    
} catch (PDOException $e) {
    $response['message'] = 'Error al iniciar sesión. Intenta nuevamente.';
}

echo json_encode($response);
?>