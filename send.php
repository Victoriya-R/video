<?php

declare(strict_types=1);

const RECEIVING_EMAIL = 'YOUR_RECEIVING_EMAIL';
const SITE_NAME = 'A. Videographer';
const MIN_FORM_FILL_SECONDS = 3;

$isAjax = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function respond(array $payload, int $statusCode = 200): void
{
    global $isAjax;

    if ($isAjax) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    $query = http_build_query($payload);
    header('Location: index.html' . ($query !== '' ? ('?' . $query) : '') . '#contacts');
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(['ok' => false, 'error' => 'invalid_request'], 405);
}

$company = trim((string)($_POST['company'] ?? ''));
$formTime = (int)($_POST['form_time'] ?? 0);
$nowMs = (int) floor(microtime(true) * 1000);

if ($company !== '' || $formTime <= 0 || (($nowMs - $formTime) < (MIN_FORM_FILL_SECONDS * 1000))) {
    respond(['ok' => false, 'error' => 'spam_detected'], 400);
}

$name = trim((string)($_POST['name'] ?? ''));
$contact = trim((string)($_POST['contact'] ?? ''));
$type = trim((string)($_POST['type'] ?? ''));
$date = trim((string)($_POST['date'] ?? ''));
$location = trim((string)($_POST['location'] ?? ''));
$comment = trim((string)($_POST['comment'] ?? ''));

if ($name === '' || $contact === '' || $type === '') {
    respond(['ok' => false, 'error' => 'missing_required'], 422);
}

$clean = static function (string $value): string {
    $value = str_replace(["\r", "\n", '%0a', '%0d', 'Content-Type:', 'bcc:', 'cc:'], ' ', $value);
    $value = strip_tags($value);
    return trim($value);
};

$name = $clean($name);
$contact = $clean($contact);
$type = $clean($type);
$date = $clean($date);
$location = $clean($location);
$comment = $clean($comment);

$subject = 'Новая заявка с сайта — ' . SITE_NAME;

$lines = [
    'Новая заявка с сайта видеографа',
    '------------------------------',
    'Имя: ' . ($name !== '' ? $name : '—'),
    'Способ связи: ' . ($contact !== '' ? $contact : '—'),
    'Тип съемки: ' . ($type !== '' ? $type : '—'),
    'Дата: ' . ($date !== '' ? $date : '—'),
    'Место: ' . ($location !== '' ? $location : '—'),
    'Комментарий: ' . ($comment !== '' ? $comment : '—'),
    '------------------------------',
    'IP: ' . (($_SERVER['REMOTE_ADDR'] ?? 'unknown')),
    'User-Agent: ' . (($_SERVER['HTTP_USER_AGENT'] ?? 'unknown')),
];

$message = implode(PHP_EOL, $lines);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'),
    'Reply-To: noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'),
    'X-Mailer: PHP/' . phpversion(),
];

$mailSent = @mail(RECEIVING_EMAIL, '=?UTF-8?B?' . base64_encode($subject) . '?=', $message, implode("\r\n", $headers));

if (!$mailSent) {
    respond(['ok' => false, 'error' => 'server_error'], 500);
}

respond(['ok' => true]);
