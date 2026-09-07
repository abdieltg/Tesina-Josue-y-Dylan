<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'sharee';

$conexion = new mysqli($host, $user, $password, $database);

if ($conexion->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Conexión fallida: ' . $conexion->connect_error]);
    exit;
}

$conexion->set_charset("utf8");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos incompletos']);
    exit;
}

$username = $conexion->real_escape_string($data['username']);
$email = $conexion->real_escape_string($data['email']);
$password = $data['password'];
$confirmPassword = $data['confirmPassword'];

if (strpos($email, '@escuelasproa.edu.ar') === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Solo estudiantes PROA pueden registrarse']);
    exit;
}

if ($password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['error' => 'Las contraseñas no coinciden']);
    exit;
}

$passwordEncriptada = password_hash($password, PASSWORD_BCRYPT);

$sql = "INSERT INTO usuarios (username, email, password) VALUES ('$username', '$email', '$passwordEncriptada')";

if ($conexion->query($sql)) {
    echo json_encode(['mensaje' => 'Cuenta creada correctamente']);
} else {
    if ($conexion->errno == 1062) {
        http_response_code(409);
        echo json_encode(['error' => 'El usuario o email ya existe']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear cuenta: ' . $conexion->error]);
    }
}

$conexion->close();
?>