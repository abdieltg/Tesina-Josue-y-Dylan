<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'sharee';

$conexion = new mysqli($host, $user, $password, $database);

if ($conexion->connect_error) {
    die(json_encode(['error' => 'Conexión fallida']));
}

$conexion->set_charset("utf8");

$usuario_id = intval($_GET['usuario_id']);

$sql_posts = "SELECT COUNT(*) as count FROM posts WHERE usuario_id = $usuario_id";
$result_posts = $conexion->query($sql_posts);
$posts = $result_posts->fetch_assoc()['count'];

$sql_followers = "SELECT COUNT(*) as count FROM seguidores WHERE seguido_id = $usuario_id";
$result_followers = $conexion->query($sql_followers);
$followers = $result_followers->fetch_assoc()['count'];

$sql_following = "SELECT COUNT(*) as count FROM seguidores WHERE seguidor_id = $usuario_id";
$result_following = $conexion->query($sql_following);
$following = $result_following->fetch_assoc()['count'];

echo json_encode([
    'posts' => $posts,
    'followers' => $followers,
    'following' => $following
]);

$conexion->close();
?>