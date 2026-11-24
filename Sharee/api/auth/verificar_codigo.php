<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once dirname(__DIR__) . '/conexion.php';

header('Content-Type: application/json; charset=utf-8');

function responderVerificacion(int $status, array $contenido): void
{
    http_response_code($status);
    echo json_encode(
        $contenido,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderVerificacion(405, [
        'success' => false,
        'message' => 'Método no permitido.',
    ]);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    responderVerificacion(400, [
        'success' => false,
        'message' => 'Datos inválidos.',
    ]);
}

$email = strtolower(trim((string) ($data['email'] ?? '')));
$codigo = trim((string) ($data['codigo'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $codigo)) {
    responderVerificacion(422, [
        'success' => false,
        'message' => 'Ingresa un código válido de seis dígitos.',
    ]);
}

try {
    $pdo->beginTransaction();

    // Serializa la asignación del rol del primer usuario.
    $stmt = $pdo->query(
        'SELECT id FROM admin_bootstrap_lock WHERE id = 1 FOR UPDATE'
    );

    if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        throw new RuntimeException(
            'Falta la fila admin_bootstrap_lock. Comprueba la migración de roles.'
        );
    }

    $stmt = $pdo->prepare(
        'SELECT id, nombre, apellido, username, email,
                password_hash, codigo_hash, expira_en, intentos,
                terminos_aceptados_en, terminos_version
         FROM registros_pendientes
         WHERE email = ?
         LIMIT 1
         FOR UPDATE'
    );
    $stmt->execute([$email]);
    $pendiente = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pendiente) {
        $pdo->commit();
        responderVerificacion(404, [
            'success' => false,
            'message' => 'No hay un registro pendiente para ese correo. Vuelve a registrarte.',
        ]);
    }

    if (empty($pendiente['terminos_aceptados_en']) || empty($pendiente['terminos_version'])) {
        $pdo->commit();
        responderVerificacion(422, [
            'success' => false,
            'message' => 'El registro no contiene la aceptación de términos. Vuelve a registrarte y acepta los términos.',
        ]);
    }

    $expira = new DateTimeImmutable(
        $pendiente['expira_en'],
        new DateTimeZone('UTC')
    );
    $ahora = new DateTimeImmutable('now', new DateTimeZone('UTC'));

    if ($expira <= $ahora) {
        $pdo->commit();
        responderVerificacion(410, [
            'success' => false,
            'message' => 'El código venció. Puedes solicitar uno nuevo.',
            'expired' => true,
        ]);
    }

    if ((int) $pendiente['intentos'] >= 5) {
        $pdo->commit();
        responderVerificacion(429, [
            'success' => false,
            'message' => 'Se agotaron los intentos. Espera el vencimiento y solicita un código nuevo.',
        ]);
    }

    if (!password_verify($codigo, $pendiente['codigo_hash'])) {
        $intentos = (int) $pendiente['intentos'] + 1;

        $stmt = $pdo->prepare(
            'UPDATE registros_pendientes
             SET intentos = ?
             WHERE id = ?'
        );
        $stmt->execute([$intentos, $pendiente['id']]);

        $pdo->commit();

        responderVerificacion(422, [
            'success' => false,
            'message' => $intentos >= 5
                ? 'Se agotaron los intentos. Espera el vencimiento y solicita un código nuevo.'
                : 'El código no es correcto. Revisa el correo e inténtalo nuevamente.',
        ]);
    }

    $stmt = $pdo->prepare(
        'SELECT id
         FROM usuarios
         WHERE email = ? OR username = ?
         LIMIT 1'
    );
    $stmt->execute([$pendiente['email'], $pendiente['username']]);

    if ($stmt->fetch(PDO::FETCH_ASSOC)) {
        $stmt = $pdo->prepare(
            'DELETE FROM registros_pendientes WHERE id = ?'
        );
        $stmt->execute([$pendiente['id']]);

        $pdo->commit();

        responderVerificacion(409, [
            'success' => false,
            'message' => 'El correo o el nombre de usuario ya está registrado.',
        ]);
    }

    $cantidadUsuarios = (int) $pdo
        ->query('SELECT COUNT(*) FROM usuarios')
        ->fetchColumn();

    $rol = $cantidadUsuarios === 0 ? 'admin' : 'user';

    $stmt = $pdo->prepare(
        'INSERT INTO usuarios
            (nombre, apellido, username, email, password, role,
             terminos_aceptados_en, terminos_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $pendiente['nombre'],
        $pendiente['apellido'],
        $pendiente['username'],
        $pendiente['email'],
        $pendiente['password_hash'],
        $rol,
        $pendiente['terminos_aceptados_en'],
        $pendiente['terminos_version'],
    ]);

    $stmt = $pdo->prepare(
        'DELETE FROM registros_pendientes WHERE id = ?'
    );
    $stmt->execute([$pendiente['id']]);

    $pdo->commit();

    responderVerificacion(200, [
        'success' => true,
        'role' => $rol,
        'message' => $rol === 'admin'
            ? '¡Bienvenido a Sharee! Tu cuenta se creó como administradora.'
            : '¡Bienvenido a Sharee! Tu cuenta fue creada correctamente.',
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        'Error al verificar código y crear cuenta: ' .
        $e->getMessage() .
        ' en ' . $e->getFile() .
        ':' . $e->getLine()
    );

    responderVerificacion(500, [
        'success' => false,
        'message' => 'No se pudo verificar el código. Revisa el log de PHP.',
    ]);
}