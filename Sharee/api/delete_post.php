<?php
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

$post_id = intval($data['post_id']);
$usuario_id = intval($data['usuario_id']);

$sql = "SELECT usuario_id FROM posts WHERE id = $post_id";
$result = $conexion->query($sql);

if ($result->num_rows == 0) {
    echo json_encode(['error' => 'Post no encontrado']);
    exit;
}

$post = $result->fetch_assoc();

if ($post['usuario_id'] != $usuario_id) {
    echo json_encode(['error' => 'No puedes eliminar posts ajenos']);
    exit;
}

$sql = "DELETE FROM likes WHERE post_id = $post_id";
$conexion->query($sql);

$sql = "DELETE FROM posts WHERE id = $post_id";

if ($conexion->query($sql)) {
    echo json_encode(['mensaje' => 'Post eliminado correctamente']);
} else {
    echo json_encode(['error' => $conexion->error]);
}

$conexion->close();
?>