<?php
// Ce script est utilisé pour stocker temporairement l'email saisi par l'utilisateur
// quand il n'est pas formellement connecté (pour la démonstration)
session_start();

// Vérifier si la requête est de type POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Récupérer le contenu JSON envoyé
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Vérifier si l'email est présent
    if (!isset($data['email']) || empty($data['email'])) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Email requis']);
        exit;
    }
    
    // Stocker l'email et éventuellement d'autres données dans la session
    $_SESSION['temp_email'] = $data['email'];
    
    if (isset($data['name'])) {
        $_SESSION['temp_name'] = $data['name'];
    } else {
        $_SESSION['temp_name'] = ucfirst(explode('@', $data['email'])[0]); // Créer un nom à partir de l'email
    }
    
    // Répondre avec succès
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true, 
        'message' => 'Email temporaire enregistré',
        'user' => [
            'name' => $_SESSION['temp_name'],
            'email' => $_SESSION['temp_email']
        ]
    ]);
} else {
    // Si la méthode n'est pas POST, renvoyer une erreur
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>
