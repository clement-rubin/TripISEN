<?php
// Initialiser la session
session_start();

// Inclure la connexion à la base de données
require_once 'db_connect.php';

// Vérifier si l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    // Vérifier s'il existe une session temporaire
    if (isset($_SESSION['temp_email'])) {
        // Récupérer les données
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Mettre à jour les préférences temporaires
        $_SESSION['temp_newsletters'] = isset($data['newsletters']) ? (bool)$data['newsletters'] : false;
        $_SESSION['temp_offers'] = isset($data['offers']) ? (bool)$data['offers'] : false;
        $_SESSION['temp_language'] = isset($data['language']) ? $data['language'] : 'fr';
        
        // Répondre avec succès
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Préférences mises à jour (mode temporaire)',
            'preferences' => [
                'newsletters' => $_SESSION['temp_newsletters'],
                'offers' => $_SESSION['temp_offers'],
                'language' => $_SESSION['temp_language']
            ]
        ]);
        exit;
    }
    
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    exit;
}

// Vérifier si la requête est de type POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Récupérer le contenu JSON envoyé
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Récupérer l'ID de l'utilisateur connecté
    $user_id = $_SESSION['user_id'];
    
    // Préparer les données pour la mise à jour
    $newsletters = isset($data['newsletters']) ? ($data['newsletters'] ? 1 : 0) : 0;
    $offers = isset($data['offers']) ? ($data['offers'] ? 1 : 0) : 0;
    $language = isset($data['language']) ? mysqli_real_escape_string($conn, $data['language']) : 'fr';
    
    // Vérifier si l'utilisateur a déjà des préférences
    $checkQuery = "SELECT * FROM user_preferences WHERE user_id = $user_id";
    $result = mysqli_query($conn, $checkQuery);
    
    if ($result && mysqli_num_rows($result) > 0) {
        // Mettre à jour les préférences existantes
        $query = "UPDATE user_preferences SET 
                  newsletters = $newsletters, 
                  offers = $offers, 
                  language = '$language'
                  WHERE user_id = $user_id";
    } else {
        // Insérer de nouvelles préférences
        $query = "INSERT INTO user_preferences (user_id, newsletters, offers, language)
                  VALUES ($user_id, $newsletters, $offers, '$language')";
    }
    
    if (mysqli_query($conn, $query)) {
        // Renvoyer une réponse de succès
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Préférences mises à jour avec succès',
            'preferences' => [
                'newsletters' => (bool)$newsletters,
                'offers' => (bool)$offers,
                'language' => $language
            ]
        ]);
    } else {
        // En cas d'erreur, renvoyer un message d'erreur
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . mysqli_error($conn)]);
    }
} else {
    // Si la méthode n'est pas POST, renvoyer une erreur
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}

// Fermer la connexion
mysqli_close($conn);
?>
