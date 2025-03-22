<?php
// api-proxy.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$apiUrl = isset($_GET['url']) ? $_GET['url'] : null;
if (!$apiUrl) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing URL parameter']);
    exit;
}

// Authentification
$username = 'clément'; 
$password = 'Chance76!';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, "$username:$password");
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;
?>