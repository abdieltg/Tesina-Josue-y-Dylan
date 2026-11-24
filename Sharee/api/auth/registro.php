<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once dirname(__DIR__) . '/conexion.php';
require_once __DIR__ . '/email_verification.php';

header('Content-Type: application/json; charset=utf-8');

const SHAREE_TERMS_VERSION = '1.0';

function responderRegistro(int $status, array $contenido): void
{
    http_response_code($status);
    echo json_encode(
        $contenido,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderRegistro(405, [
        'success' => false,
        'message' => 'Método no permitido.',
    ]);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    responderRegistro(400, [
        'success' => false,
        'message' => 'Los datos enviados no son válidos.',
    ]);
}

$nombre = trim((string) ($data['nombre'] ?? ''));
$apellido = trim((string) ($data['apellido'] ?? ''));
$username = trim((string) ($data['username'] ?? ''));
$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');
$passwordConfirm = (string) ($data['passwordConfirm'] ?? '');

if (($data['acepta_terminos'] ?? false) !== true) {
    responderRegistro(422, [
        'success' => false,
        'message' => 'Debes aceptar los términos y condiciones para registrarte.',
        'errors' => [
            'terminos' => 'Acepta los términos para continuar.',
        ],
    ]);
}

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

$dominio = '@escuelasproa.edu.ar';

if ($email === '') {
    $errors['email'] = 'El email es obligatorio.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'El email no es válido.';
} elseif (substr($email, -strlen($dominio)) !== $dominio) {
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

try {
    // Si hay un registro vigente, deja que la persona use el código ya enviado.
    $stmt = $pdo->prepare(
        'SELECT expira_en
         FROM registros_pendientes
         WHERE email = ?
         LIMIT 1'
    );
    $stmt->execute([$email]);
    $pendiente = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($pendiente) {
        $expiraTimestamp = strtotime($pendiente['expira_en'] . ' UTC');

        if ($expiraTimestamp !== false && $expiraTimestamp > time()) {
            responderRegistro(200, [
                'success' => true,
                'message' => 'Ya enviamos un código a ese correo. Revisa tu bandeja.',
                'expires_in' => $expiraTimestamp - time(),
                'email' => $email,
            ]);
        }

        $stmt = $pdo->prepare(
            'DELETE FROM registros_pendientes WHERE email = ?'
        );
        $stmt->execute([$email]);
    }

    $stmt = $pdo->prepare(
        'SELECT email, username
         FROM usuarios
         WHERE email = ? OR username = ?
         LIMIT 1'
    );
    $stmt->execute([$email, $username]);
    $existente = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existente) {
        $emailOcupado = strcasecmp($existente['email'], $email) === 0;
        $campo = $emailOcupado ? 'email' : 'username';
        $mensaje = $emailOcupado
            ? 'Este email ya está registrado.'
            : 'Este nombre de usuario ya está en uso.';

        responderRegistro(409, [
            'success' => false,
            'message' => $mensaje,
            'errors' => [$campo => $mensaje],
        ]);
    }

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
    $fechaAceptacion = gmdate('Y-m-d H:i:s');

    $stmt = $pdo->prepare(
        'INSERT INTO registros_pendientes
            (nombre, apellido, username, email, password_hash,
             codigo_hash, expira_en, intentos, creado_en,
             terminos_aceptados_en, terminos_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)'
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
        $fechaAceptacion,
        SHAREE_TERMS_VERSION,
    ]);

    if (!enviarCodigoVerificacion($email, $nombre, $codigo)) {
        $stmt = $pdo->prepare(
            'DELETE FROM registros_pendientes WHERE email = ?'
        );
        $stmt->execute([$email]);

        responderRegistro(503, [
            'success' => false,
            'message' => 'No se pudo enviar el correo. Revisa la configuración SMTP.',
        ]);
    }

    responderRegistro(200, [
        'success' => true,
        'message' => 'Te enviamos un código de verificación. Revisa tu correo.',
        'expires_in' => 300,
        'email' => $email,
    ]);
} catch (Throwable $e) {
    error_log(
        'Error en registro.php: ' .
        $e->getMessage() .
        ' en ' . $e->getFile() .
        ':' . $e->getLine()
    );

    responderRegistro(500, [
        'success' => false,
        'message' => 'No se pudo iniciar el registro. Revisa el log de PHP.',
    ]);
}