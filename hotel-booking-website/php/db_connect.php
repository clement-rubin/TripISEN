<?php
// Désactiver l'affichage des erreurs pour éviter de corrompre le JSON
error_reporting(0);
ini_set('display_errors', 0);

// Paramètres de connexion à la base de données
$server = "localhost";
$username = "root";
$password = "root"; // Mot de passe par défaut pour MAMP
$database = "tripisen";

// Création de la connexion
$conn = new mysqli($server, $username, $password, $database);

// Vérification de la connexion mais sans afficher d'erreur
if ($conn->connect_error) {
    // Logger l'erreur au lieu de l'afficher
    error_log("Connexion échouée: " . $conn->connect_error);
}

// Configuration de l'encodage UTF-8
if ($conn) {
    $conn->set_charset("utf8mb4");
}
?>