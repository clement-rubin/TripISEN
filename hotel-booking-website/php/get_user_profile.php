<?php
// Bloquer toute sortie avant les headers
ob_start();

// Désactiver l'affichage des erreurs pour éviter de corrompre le JSON
error_reporting(0);
ini_set('display_errors', 0);

// Initialiser la session
session_start();

// Définir le type de contenu avant toute sortie
header('Content-Type: application/json');

// Inclure la connexion à la base de données
require_once 'db_connect.php';

// Logger pour débogage
error_log("get_user_profile.php appelé - Session ID: " . session_id());
error_log("Session: " . print_r($_SESSION, true));

// Vérifier si l'utilisateur est connecté via session ou simulé
if (!isset($_SESSION['user_id'])) {
    // Si l'utilisateur n'est pas connecté, vérifier s'il existe une session temporaire
    if (isset($_SESSION['temp_email'])) {
        error_log("Utilisateur temporaire trouvé: " . $_SESSION['temp_email']);
        
        // Créer un profil temporaire basé sur les données de session
        echo json_encode([
            'success' => true,
            'user' => [
                'name' => isset($_SESSION['temp_name']) ? $_SESSION['temp_name'] : ucfirst(explode('@', $_SESSION['temp_email'])[0]),
                'email' => $_SESSION['temp_email'],
                'phone' => isset($_SESSION['temp_phone']) ? $_SESSION['temp_phone'] : '',
                'address' => isset($_SESSION['temp_address']) ? $_SESSION['temp_address'] : '',
                'city' => isset($_SESSION['temp_city']) ? $_SESSION['temp_city'] : '',
                'postal_code' => isset($_SESSION['temp_postal_code']) ? $_SESSION['temp_postal_code'] : '',
                'country' => isset($_SESSION['temp_country']) ? $_SESSION['temp_country'] : '',
                'preferences' => [
                    'newsletters' => isset($_SESSION['temp_newsletters']) ? (bool)$_SESSION['temp_newsletters'] : false,
                    'offers' => isset($_SESSION['temp_offers']) ? (bool)$_SESSION['temp_offers'] : false,
                    'language' => isset($_SESSION['temp_language']) ? $_SESSION['temp_language'] : 'fr'
                ]
            ]
        ]);
        ob_end_flush();
        exit;
    }
    
    error_log("Aucun utilisateur trouvé en session");
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    ob_end_flush();
    exit;
}

// L'utilisateur est connecté, récupérer son profil
$user_id = $_SESSION['user_id'];
error_log("Récupération des données de l'utilisateur ID: " . $user_id);

// Requête pour récupérer les informations utilisateur avec gestion des erreurs
try {
    $query = "SELECT * FROM users WHERE id = ?";
    $stmt = mysqli_prepare($conn, $query);
    
    if (!$stmt) {
        throw new Exception("Erreur de préparation de la requête: " . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($stmt, "i", $user_id);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Erreur d'exécution de la requête: " . mysqli_stmt_error($stmt));
    }
    
    $result = mysqli_stmt_get_result($stmt);
    
    if (!$result) {
        throw new Exception("Erreur lors de la récupération du résultat: " . mysqli_error($conn));
    }
    
    if (mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        
        // Récupérer les préférences utilisateur
        $preferences = [];
        $prefsQuery = "SELECT * FROM user_preferences WHERE user_id = ?";
        $prefsStmt = mysqli_prepare($conn, $prefsQuery);
        
        if ($prefsStmt) {
            mysqli_stmt_bind_param($prefsStmt, "i", $user_id);
            mysqli_stmt_execute($prefsStmt);
            $prefsResult = mysqli_stmt_get_result($prefsStmt);
            
            if ($prefsResult && mysqli_num_rows($prefsResult) > 0) {
                $prefs = mysqli_fetch_assoc($prefsResult);
                $preferences = [
                    'newsletters' => (bool)$prefs['newsletters'],
                    'offers' => (bool)$prefs['offers'],
                    'language' => $prefs['language']
                ];
            } else {
                // Préférences par défaut
                $preferences = [
                    'newsletters' => false,
                    'offers' => false,
                    'language' => 'fr'
                ];
            }
            
            mysqli_stmt_close($prefsStmt);
        }
        
        // Ajouter les préférences à l'objet utilisateur
        $user['preferences'] = $preferences;
        
        // Renvoyer les informations utilisateur
        echo json_encode(['success' => true, 'user' => $user]);
        error_log("Profil utilisateur récupéré avec succès pour l'utilisateur ID: " . $user_id);
    } else {
        // Utilisateur non trouvé dans la base de données
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé']);
        error_log("Utilisateur ID " . $user_id . " non trouvé dans la base de données");
    }
    
    mysqli_stmt_close($stmt);
} catch (Exception $e) {
    error_log("Exception dans get_user_profile.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}

// Fermer la connexion
mysqli_close($conn);

// S'assurer qu'aucune sortie supplémentaire n'est envoyée
ob_end_flush();
?>
