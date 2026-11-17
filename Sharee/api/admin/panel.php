<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once dirname(__DIR__) . '/conexion.php';
require_once dirname(__DIR__) . '/sesion.php';

header('Content-Type: application/json; charset=utf-8');

function responderAdmin(int $status, array $contenido): void
{
    http_response_code($status);
    echo json_encode(
        $contenido,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit();
}

function exigirAdministrador(PDO $pdo, int $usuarioId): void
{
    $stmt = $pdo->prepare(
        'SELECT role FROM usuarios WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$usuarioId]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || $usuario['role'] !== 'admin') {
        responderAdmin(403, [
            'success' => false,
            'message' => 'No tienes permisos de administrador.',
        ]);
    }
}

if (!estaAutenticado()) {
    responderAdmin(401, [
        'success' => false,
        'message' => 'Debes iniciar sesión.',
    ]);
}

$adminId = (int) obtenerUsuarioAutenticado();

try {
    exigirAdministrador($pdo, $adminId);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $usuarios = $pdo->query(
            'SELECT id, nombre, apellido, username, email, role, created_at
             FROM usuarios
             ORDER BY id ASC
             LIMIT 500'
        )->fetchAll(PDO::FETCH_ASSOC);

        $publicaciones = $pdo->query(
            'SELECT p.id, p.usuario_id, p.contenido, p.imagen_url,
                    p.created_at, u.username, u.nombre, u.apellido
             FROM publicaciones p
             INNER JOIN usuarios u ON u.id = p.usuario_id
             ORDER BY p.created_at DESC
             LIMIT 200'
        )->fetchAll(PDO::FETCH_ASSOC);

        responderAdmin(200, [
            'success' => true,
            'data' => [
                'usuarios' => $usuarios,
                'publicaciones' => $publicaciones,
            ],
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        responderAdmin(405, [
            'success' => false,
            'message' => 'Método no permitido.',
        ]);
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data) || ($data['action'] ?? '') !== 'set_role') {
        responderAdmin(400, [
            'success' => false,
            'message' => 'Solicitud inválida.',
        ]);
    }

    $usuarioObjetivoId = filter_var(
        $data['user_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );
    $rolNuevo = (string) ($data['role'] ?? '');

    if (!$usuarioObjetivoId || !in_array($rolNuevo, ['user', 'admin'], true)) {
        responderAdmin(422, [
            'success' => false,
            'message' => 'El usuario o el rol no son válidos.',
        ]);
    }

    $pdo->beginTransaction();

    $stmtLock = $pdo->query(
        'SELECT id FROM admin_bootstrap_lock WHERE id = 1 FOR UPDATE'
    );
    $stmtLock->fetch(PDO::FETCH_ASSOC);

    // Revalidar dentro de la transacción: no confiar en el estado del navegador.
    exigirAdministrador($pdo, $adminId);

    $stmt = $pdo->prepare(
        'SELECT id, role FROM usuarios WHERE id = ? LIMIT 1 FOR UPDATE'
    );
    $stmt->execute([$usuarioObjetivoId]);
    $usuarioObjetivo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuarioObjetivo) {
        $pdo->rollBack();
        responderAdmin(404, [
            'success' => false,
            'message' => 'No se encontró ese usuario.',
        ]);
    }

    if ($usuarioObjetivo['role'] === $rolNuevo) {
        $pdo->commit();
        responderAdmin(200, [
            'success' => true,
            'message' => 'El usuario ya tiene ese rol.',
        ]);
    }

    if ($usuarioObjetivo['role'] === 'admin' && $rolNuevo === 'user') {
        $totalAdmins = (int) $pdo
            ->query("SELECT COUNT(*) FROM usuarios WHERE role = 'admin'")
            ->fetchColumn();

        if ($totalAdmins <= 1) {
            $pdo->rollBack();
            responderAdmin(409, [
                'success' => false,
                'message' => 'No puedes quitar el rol al último administrador.',
            ]);
        }
    }

    $stmt = $pdo->prepare(
        'UPDATE usuarios SET role = ? WHERE id = ?'
    );
    $stmt->execute([$rolNuevo, $usuarioObjetivoId]);

    $pdo->commit();

    responderAdmin(200, [
        'success' => true,
        'message' => $rolNuevo === 'admin'
            ? 'El usuario ahora es administrador.'
            : 'Se quitó el rol de administrador.',
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        'Error en panel de administración: ' .
        $e->getMessage() .
        ' en ' . $e->getFile() .
        ':' . $e->getLine()
    );

    responderAdmin(500, [
        'success' => false,
        'message' => 'Error interno al cargar o actualizar la administración.',
    ]);
}