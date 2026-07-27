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

if (!isset($_GET['usuario_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'usuario_id requerido']);
    exit;
}

$usuario_id = intval($_GET['usuario_id']);

$sql_posts = "SELECT COUNT(*) as count FROM posts WHERE usuario_id = $usuario_id";
$result_posts = $conexion->query($sql_posts);
$posts = $result_posts ? $result_posts->fetch_assoc()['count'] : 0;

$sql_followers = "SELECT COUNT(*) as count FROM seguidores WHERE seguido_id = $usuario_id";
$result_followers = $conexion->query($sql_followers);
$followers = $result_followers ? $result_followers->fetch_assoc()['count'] : 0;

$sql_following = "SELECT COUNT(*) as count FROM seguidores WHERE seguidor_id = $usuario_id";
$result_following = $conexion->query($sql_following);
$following = $result_following ? $result_following->fetch_assoc()['count'] : 0;

echo json_encode([
    'posts' => $posts,
    'followers' => $followers,
    'following' => $following
]);

$conexion->close();
?>