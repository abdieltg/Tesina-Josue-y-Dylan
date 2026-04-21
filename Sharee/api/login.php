<?php
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

$email = $conexion->real_escape_string($data['email']);
$password = $data['password'];

$sql = "SELECT id, username, password FROM usuarios WHERE email = '$email'";
$result = $conexion->query($sql);

if ($result->num_rows > 0) {
    $usuario = $result->fetch_assoc();
    
    if (password_verify($password, $usuario['password'])) {
        echo json_encode([
            'exito' => true,
            'usuario_id' => $usuario['id'],
            'username' => $usuario['username'],
            'email' => $email
        ]);
    } else {
        echo json_encode(['error' => 'Contraseña incorrecta']);
    }
} else {
    echo json_encode(['error' => 'Email no encontrado']);
}

$conexion->close();
?>