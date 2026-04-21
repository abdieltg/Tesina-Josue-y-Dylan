<?php
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

$usuario_id = intval($data['usuario_id']);
$post_id = intval($data['post_id']);

$sql = "SELECT id FROM likes WHERE usuario_id = $usuario_id AND post_id = $post_id";
$result = $conexion->query($sql);

if ($result->num_rows > 0) {
 
    $sql = "DELETE FROM likes WHERE usuario_id = $usuario_id AND post_id = $post_id";
    $conexion->query($sql);
    
    $sql = "UPDATE posts SET likes = likes - 1 WHERE id = $post_id";
    $conexion->query($sql);
    
    echo json_encode(['mensaje' => 'Like removido']);
} else {

    $sql = "INSERT INTO likes (usuario_id, post_id) VALUES ($usuario_id, $post_id)";
    $conexion->query($sql);
    
    $sql = "UPDATE posts SET likes = likes + 1 WHERE id = $post_id";
    $conexion->query($sql);
    
    echo json_encode(['mensaje' => 'Like agregado']);
}

$conexion->close();
?>