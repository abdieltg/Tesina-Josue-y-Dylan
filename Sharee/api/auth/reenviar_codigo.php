<?php

require_once dirname(__DIR__) . '/conexion.php';
require_once __DIR__ . '/email_verification.php';

header('Content-Type: application/json; charset=utf-8');

function responderReenvio(int $status, array $contenido): void
{
    http_response_code($status);
    echo json_encode($contenido, JSON_UNESCAPED_UNICODE);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderReenvio(405, ['success' => false, 'message' => 'Método no permitido']);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    responderReenvio(400, ['success' => false, 'message' => 'Datos inválidos']);
}

$email = strtolower(trim((string) ($data['email'] ?? '')));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responderReenvio(422, ['success' => false, 'message' => 'El correo no es válido.']);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'SELECT id, nombre, email, expira_en
         FROM registros_pendientes
         WHERE email = ?
         LIMIT 1
         FOR UPDATE'
    );
    $stmt->execute([$email]);
    $pendiente = $stmt->fetch();

    if (!$pendiente) {
        $pdo->commit();
        responderReenvio(404, [
            'success' => false,
            'message' => 'No hay un registro pendiente para ese correo. Vuelve a completar el registro.',
        ]);
    }

    $expira = new DateTimeImmutable($pendiente['expira_en'], new DateTimeZone('UTC'));
    $ahora = new DateTimeImmutable('now', new DateTimeZone('UTC'));

    if ($expira > $ahora) {
        $segundosRestantes = $expira->getTimestamp() - $ahora->getTimestamp();
        $pdo->commit();

        responderReenvio(429, [
            'success' => false,
            'message' => 'Solo puedes reenviar el código cuando venza el actual.',
            'retry_after' => $segundosRestantes,
        ]);
    }

    $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $nuevaExpiracion = time() + 300;

    $stmt = $pdo->prepare(
        'UPDATE registros_pendientes
         SET codigo_hash = ?, expira_en = ?, intentos = 0, creado_en = ?
         WHERE id = ?'
    );
    $stmt->execute([
        password_hash($codigo, PASSWORD_DEFAULT),
        gmdate('Y-m-d H:i:s', $nuevaExpiracion),
        gmdate('Y-m-d H:i:s'),
        $pendiente['id'],
    ]);

    if (!enviarCodigoVerificacion($email, $pendiente['nombre'], $codigo)) {
        $pdo->rollBack();
        responderReenvio(503, [
            'success' => false,
            'message' => 'No pudimos enviar el correo. Intenta nuevamente más tarde.',
        ]);
    }

    $pdo->commit();

    responderReenvio(200, [
        'success' => true,
        'message' => 'Te enviamos un nuevo código. Revisa tu correo.',
        'expires_in' => 300,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Error al reenviar el código: ' . $e->getMessage());
    responderReenvio(500, [
        'success' => false,
        'message' => 'No pudimos reenviar el código. Intenta nuevamente.',
    ]);
}