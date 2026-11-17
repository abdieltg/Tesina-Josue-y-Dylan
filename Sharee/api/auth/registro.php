<?php

ob_start();

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

function responderRegistro(int $status, array $contenido): void
{
    if (ob_get_level() > 0) {
        ob_clean();
    }

    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $contenido,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function esEntornoLocal(): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    return in_array($ip, ['127.0.0.1', '::1'], true);
}

function registrarErrorRegistro(Throwable $e): void
{
    error_log(
        'Error en registro.php: ' .
        $e->getMessage() .
        ' en ' . $e->getFile() .
        ':' . $e->getLine()
    );
}

set_exception_handler(function (Throwable $e): void {
    registrarErrorRegistro($e);

    $respuesta = [
        'success' => false,
        'message' => 'Error interno del servidor al iniciar el registro.',
    ];

    // Detalle solamente para el servidor local de desarrollo.
    if (esEntornoLocal()) {
        $respuesta['debug'] = $e->getMessage();
        $respuesta['archivo'] = basename($e->getFile());
        $respuesta['linea'] = $e->getLine();
    }

    responderRegistro(500, $respuesta);
});

register_shutdown_function(function (): void {
    $error = error_get_last();
    $erroresFatales = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR];

    if (!$error || !in_array($error['type'], $erroresFatales, true)) {
        return;
    }

    error_log(
        'Error fatal en registro.php: ' .
        $error['message'] .
        ' en ' . $error['file'] .
        ':' . $error['line']
    );

    if (headers_sent()) {
        return;
    }

    if (ob_get_level() > 0) {
        ob_clean();
    }

    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');

    $respuesta = [
        'success' => false,
        'message' => 'Error fatal de PHP al iniciar el registro.',
    ];

    if (esEntornoLocal()) {
        $respuesta['debug'] = $error['message'];
        $respuesta['archivo'] = basename($error['file']);
        $respuesta['linea'] = $error['line'];
    }

    echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
});

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderRegistro(405, [
        'success' => false,
        'message' => 'Método no permitido.',
    ]);
}

try {
    require_once dirname(__DIR__) . '/conexion.php';
    require_once __DIR__ . '/email_verification.php';

    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('No se inicializó la conexión PDO en api/conexion.php.');
    }

    $contenido = file_get_contents('php://input');
    $data = json_decode($contenido, true);

    if (!is_array($data)) {
        responderRegistro(400, [
            'success' => false,
            'message' => 'Los datos enviados no son JSON válido.',
        ]);
    }

    $nombre = trim((string) ($data['nombre'] ?? ''));
    $apellido = trim((string) ($data['apellido'] ?? ''));
    $username = trim((string) ($data['username'] ?? ''));
    $email = strtolower(trim((string) ($data['email'] ?? '')));
    $password = (string) ($data['password'] ?? '');
    $passwordConfirm = (string) ($data['passwordConfirm'] ?? '');

    $errors = [];

    if ($nombre === '') {
        $errors['nombre'] = 'El nombre es obligatorio.';
    }

    if ($apellido === '') {
        $errors['apellido'] = 'El apellido es obligatorio.';
    }

    if ($username === '') {
        $errors['username'] = 'El nombre de usuario es obligatorio.';
    } elseif (strlen($username) < 3) {
        $errors['username'] = 'El nombre de usuario debe tener al menos 3 caracteres.';
    } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $errors['username'] = 'El usuario solo puede contener letras, números y guiones bajos.';
    }

    $dominioInstitucional = '@escuelasproa.edu.ar';

    if ($email === '') {
        $errors['email'] = 'El email es obligatorio.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'El email no es válido.';
    } elseif (substr($email, -strlen($dominioInstitucional)) !== $dominioInstitucional) {
        $errors['email'] = 'Debes usar un email institucional (@escuelasproa.edu.ar).';
    }

    if ($password === '') {
        $errors['password'] = 'La contraseña es obligatoria.';
    } elseif (strlen($password) < 6) {
        $errors['password'] = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if ($passwordConfirm === '') {
        $errors['passwordConfirm'] = 'Debes confirmar la contraseña.';
    } elseif ($password !== $passwordConfirm) {
        $errors['passwordConfirm'] = 'Las contraseñas no coinciden.';
    }

    if ($errors) {
        responderRegistro(422, [
            'success' => false,
            'message' => 'Por favor, corrige los errores.',
            'errors' => $errors,
        ]);
    }

    // Comprueba si ya existe un registro pendiente para este correo.
    $stmt = $pdo->prepare(
        'SELECT expira_en
         FROM registros_pendientes
         WHERE email = ?
         LIMIT 1'
    );
    $stmt->execute([$email]);
    $pendienteMismoEmail = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($pendienteMismoEmail) {
        $expiraTimestamp = strtotime($pendienteMismoEmail['expira_en'] . ' UTC');

        if ($expiraTimestamp !== false && $expiraTimestamp > time()) {
            responderRegistro(200, [
                'success' => true,
                'message' => 'Ya enviamos un código a ese correo. Revisa tu bandeja de entrada.',
                'expires_in' => $expiraTimestamp - time(),
                'email' => $email,
            ]);
        }

        $stmt = $pdo->prepare('DELETE FROM registros_pendientes WHERE email = ?');
        $stmt->execute([$email]);
    }

    // Comprueba si el email o username ya pertenece a una cuenta creada.
    $stmt = $pdo->prepare(
        'SELECT email, username
         FROM usuarios
         WHERE email = ? OR username = ?
         LIMIT 1'
    );
    $stmt->execute([$email, $username]);
    $usuarioExistente = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuarioExistente) {
        $emailExistente = strcasecmp(
            (string) $usuarioExistente['email'],
            $email
        ) === 0;

        $campo = $emailExistente ? 'email' : 'username';
        $mensaje = $emailExistente
            ? 'Este email ya está registrado.'
            : 'Este nombre de usuario ya está en uso.';

        responderRegistro(409, [
            'success' => false,
            'message' => $mensaje,
            'errors' => [$campo => $mensaje],
        ]);
    }

    // Evita duplicar el username entre registros pendientes.
    $stmt = $pdo->prepare(
        'SELECT id
         FROM registros_pendientes
         WHERE username = ?
         LIMIT 1'
    );
    $stmt->execute([$username]);

    if ($stmt->fetch(PDO::FETCH_ASSOC)) {
        responderRegistro(409, [
            'success' => false,
            'message' => 'Este nombre de usuario ya está en uso.',
            'errors' => [
                'username' => 'Este nombre de usuario ya está en uso.',
            ],
        ]);
    }

    $codigo = str_pad(
        (string) random_int(0, 999999),
        6,
        '0',
        STR_PAD_LEFT
    );

    $ahora = time();

    $stmt = $pdo->prepare(
        'INSERT INTO registros_pendientes
            (nombre, apellido, username, email, password_hash,
             codigo_hash, expira_en, intentos, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)'
    );

    $stmt->execute([
        $nombre,
        $apellido,
        $username,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        password_hash($codigo, PASSWORD_DEFAULT),
        gmdate('Y-m-d H:i:s', $ahora + 300),
        gmdate('Y-m-d H:i:s', $ahora),
    ]);

    if (!enviarCodigoVerificacion($email, $nombre, $codigo)) {
        $stmt = $pdo->prepare('DELETE FROM registros_pendientes WHERE email = ?');
        $stmt->execute([$email]);

        responderRegistro(503, [
            'success' => false,
            'message' => 'No se pudo enviar el correo. Revisa la configuración de Composer y SMTP.',
        ]);
    }

    responderRegistro(200, [
        'success' => true,
        'message' => 'Te enviamos un código de verificación. Revisa tu correo.',
        'expires_in' => 300,
        'email' => $email,
    ]);
} catch (Throwable $e) {
    registrarErrorRegistro($e);

    $respuesta = [
        'success' => false,
        'message' => 'Error interno del servidor al iniciar el registro.',
    ];

    // Solo muestra el detalle en localhost; nunca en producción.
    if (esEntornoLocal()) {
        $respuesta['debug'] = $e->getMessage();
        $respuesta['archivo'] = basename($e->getFile());
        $respuesta['linea'] = $e->getLine();
    }

    responderRegistro(500, $respuesta);
}