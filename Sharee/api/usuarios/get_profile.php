<?php
require_once '../conexion.php';
require_once '../sesion.php';

header('Content-Type: application/json; charset=utf-8');

if (!estaAutenticado()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'No autenticado'
    ]);
    exit();
}

$usuarioActualId = obtenerUsuarioAutenticado();
$usuarioId = $_GET['usuario_id'] ?? $usuarioActualId;
$esPerfil = ($usuarioId == $usuarioActualId);

if (!$usuarioId) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuario no especificado'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT id, nombre, apellido, username, email, avatar_url, bio, created_at
        FROM usuarios
        WHERE id = ?
    ");
    $stmt->execute([$usuarioId]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        echo json_encode([
            'success' => false,
            'message' => 'Usuario no encontrado'
        ]);
        exit();
    }

    // Contar publicaciones
    $stmtPosts = $pdo->prepare("SELECT COUNT(*) FROM publicaciones WHERE usuario_id = ?");
    $stmtPosts->execute([$usuarioId]);
    $totalPosts = (int)$stmtPosts->fetchColumn();

    // Contar seguidores
    $stmtSeguidores = $pdo->prepare("SELECT COUNT(*) FROM seguimientos WHERE seguido_id = ?");
    $stmtSeguidores->execute([$usuarioId]);
    $totalSeguidores = (int)$stmtSeguidores->fetchColumn();

    // Contar seguidos
    $stmtSeguidos = $pdo->prepare("SELECT COUNT(*) FROM seguimientos WHERE seguidor_id = ?");
    $stmtSeguidos->execute([$usuarioId]);
    $totalSeguidos = (int)$stmtSeguidos->fetchColumn();

    $data = [
        'id' => (int)$usuario['id'],
        'nombre' => $usuario['nombre'],
        'apellido' => $usuario['apellido'],
        'username' => $usuario['username'],
        'avatar_url' => $usuario['avatar_url'],
        'bio' => $usuario['bio'],
        'created_at' => $usuario['created_at'],
        'total_posts' => $totalPosts,
        'total_seguidores' => $totalSeguidores,
        'total_seguidos' => $totalSeguidos,
        'es_perfil_propio' => $esPerfil
    ];

    // Solo mostrar email si es el perfil propio
    if ($esPerfil) {
        $data['email'] = $usuario['email'];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Perfil cargado correctamente',
        'data' => $data
    ]);
} catch (PDOException $e) {
    error_log('Error cargando perfil: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar el perfil'
    ]);
}
?>