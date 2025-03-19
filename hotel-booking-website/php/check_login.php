<?php
// Bloquer toute sortie avant les headers
ob_start();

// Désactiver l'affichage des erreurs
error_reporting(0);
ini_set('display_errors', 0);

// Changer config.php par db_connect.php pour cohérence
require_once 'db_connect.php';

// Initialiser la session
session_start();

// Définir le type de contenu
header('Content-Type: application/json');

// Vérifier si l'utilisateur est connecté (soit via session complète, soit via email temporaire)
$isLoggedIn = isset($_SESSION['user_id']) || isset($_SESSION['temp_email']);
$name = isset($_SESSION['name']) ? $_SESSION['name'] : (isset($_SESSION['temp_name']) ? $_SESSION['temp_name'] : (isset($_SESSION['temp_email']) ? ucfirst(explode('@', $_SESSION['temp_email'])[0]) : ''));
$email = isset($_SESSION['email']) ? $_SESSION['email'] : (isset($_SESSION['temp_email']) ? $_SESSION['temp_email'] : '');

// Renvoyer le statut de connexion
echo json_encode([
    'isLoggedIn' => $isLoggedIn,
    'username' => $name,
    'email' => $email
]);

// S'assurer qu'aucune sortie supplémentaire n'est envoyée
ob_end_flush();
?>
