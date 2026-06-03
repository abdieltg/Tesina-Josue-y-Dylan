<?php
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

$username = $conexion->real_escape_string($data['username']);
$email = $conexion->real_escape_string($data['email']);
$password = $data['password'];
$confirmPassword = $data['confirmPassword'];

if (strpos($email, '@escuelasproa.edu.ar') === false) {
    echo json_encode(['error' => 'Solo estudiantes PROA pueden registrarse']);
    exit;
}

if ($password !== $confirmPassword) {
    echo json_encode(['error' => 'Las contraseñas no coinciden']);
    exit;
}

$passwordEncriptada = password_hash($password, PASSWORD_BCRYPT);

$sql = "INSERT INTO usuarios (username, email, password) VALUES ('$username', '$email', '$passwordEncriptada')";

if ($conexion->query($sql)) {
    echo json_encode(['mensaje' => 'Cuenta creada correctamente']);
} else {
    if ($conexion->errno == 1062) {
        echo json_encode(['error' => 'El usuario o email ya existe']);
    } else {
        echo json_encode(['error' => $conexion->error]);
    }
}

$conexion->close();
?>