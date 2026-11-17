<?php

use PHPMailer\PHPMailer\PHPMailer;

function enviarCodigoVerificacion(string $destinatario, string $nombre, string $codigo): bool
{
    $autoload = dirname(__DIR__, 2) . '/vendor/autoload.php';
    $configPath = dirname(__DIR__, 2) . '/config/mail.php';

    if (!is_file($autoload) || !is_file($configPath)) {
        error_log('Falta Composer vendor/autoload.php o config/mail.php');
        return false;
    }

    require_once $autoload;

    $config = require $configPath;
    $username = trim((string) ($config['username'] ?? ''));
    $password = trim((string) ($config['password'] ?? ''));
    $from = trim((string) ($config['from'] ?? ''));

    if ($username === '' || $password === '' || $from === '') {
        error_log('Falta configurar SHAREE_MAIL_USERNAME, SHAREE_MAIL_PASSWORD o SHAREE_MAIL_FROM');
        return false;
    }

    $nombreSeguro = htmlspecialchars($nombre, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    try {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = $password;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom($from, 'Sharee');
        $mail->addAddress($destinatario, $nombre);
        $mail->isHTML(true);
        $mail->Subject = 'Tu código de verificación de Sharee';
        $mail->Body = '
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#2D3748">
                <h2 style="color:#667EEA">Bienvenido a Sharee</h2>
                <p>Hola ' . $nombreSeguro . ',</p>
                <p>Usa este código para verificar tu correo y completar el registro:</p>
                <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#764BA2">'
                    . htmlspecialchars($codigo, ENT_QUOTES, 'UTF-8') .
                '</p>
                <p>El código vence en <strong>5 minutos</strong>. Si no solicitaste esta cuenta,
                puedes ignorar este mensaje.</p>
            </div>';
        $mail->AltBody = "Tu código de verificación de Sharee es {$codigo}. Vence en 5 minutos.";

        $mail->send();
        return true;
    } catch (Throwable $e) {
        error_log('No se pudo enviar el código de verificación: ' . $e->getMessage());
        return false;
    }
}