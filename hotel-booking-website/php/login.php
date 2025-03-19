<?php
// Bloquer toute sortie avant les headers
ob_start();

// Utiliser db_connect.php pour être cohérent avec les autres fichiers
require_once 'db_connect.php';

// Initialiser la session
session_start();

// Ne pas afficher les erreurs, les logger à la place
error_reporting(0);
ini_set('display_errors', 0);

// Log de début d'exécution
error_log("Début du script login.php");

// Définir le type de contenu avant toute sortie
header('Content-Type: application/json');

// Si pas de connexion à la BDD, retourner erreur JSON
if (!$conn) {
    error_log("Erreur de connexion à la base de données");
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
    exit;
}

// Vérifier si la requête est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    // Récupérer le contenu brut de la requête
    $rawData = file_get_contents('php://input');
    error_log("Données brutes reçues: " . $rawData);

    // Décoder le JSON
    $data = json_decode($rawData, true);

    // Vérifier si le décodage a fonctionné
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        error_log("Erreur de décodage JSON: " . json_last_error_msg());
        echo json_encode(['success' => false, 'message' => 'Format de données invalide']);
        exit;
    }

    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['email']) || !isset($data['password'])) {
        error_log("Données manquantes: email ou mot de passe");
        echo json_encode(['success' => false, 'message' => 'Email et mot de passe requis']);
        exit;
    }

    // Récupérer et nettoyer les données
    $email = mysqli_real_escape_string($conn, $data['email']);
    $password = $data['password'];
    $remember_me = isset($data['remember_me']) ? $data['remember_me'] : false;

    // Debug - enregistrer les données
    error_log("Tentative de connexion: " . $email);

    // Vérifier si l'utilisateur existe en BDD - version de développement avancée
    // On recherche d'abord l'utilisateur dans la base de données
    $query = "SELECT * FROM users WHERE email = ?";
    $stmt = mysqli_prepare($conn, $query);
    
    if (!$stmt) {
        throw new Exception("Erreur de préparation de la requête: " . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($stmt, "s", $email);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Erreur d'exécution de la requête: " . mysqli_stmt_error($stmt));
    }
    
    $result = mysqli_stmt_get_result($stmt);
    
    if (mysqli_num_rows($result) > 0) {
        // L'utilisateur existe, récupérer ses données complètes
        $user = mysqli_fetch_assoc($result);
        
        // Pour le développement, on ignore la vérification du mot de passe
        $passwordValid = true; // En production, utiliser: password_verify($password, $user['password']);
        
        if ($passwordValid) {
            // Mettre à jour les données de session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['is_logged_in'] = true;
            
            // Récupérer les préférences utilisateur
            $preferences = [];
            $prefsQuery = "SELECT * FROM user_preferences WHERE user_id = ?";
            $prefsStmt = mysqli_prepare($conn, $prefsQuery);
            
            if ($prefsStmt) {
                mysqli_stmt_bind_param($prefsStmt, "i", $user['id']);
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
            
            // Renvoyer les infos utilisateur complètes
            echo json_encode([
                'success' => true, 
                'message' => 'Connexion réussie',
                'user' => $user
            ]);
            
            error_log("Connexion réussie: données utilisateur complètes récupérées pour " . $user['email']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Mot de passe incorrect']);
        }
    } else {
        // L'utilisateur n'existe pas, créer un compte simulé pour le développement
        // En production, on renverrait une erreur à la place
        $user_id = 1; // ID simulé
        $name = ucfirst(explode('@', $email)[0]);
        
        error_log("Utilisateur non trouvé, création d'un compte temporaire pour: " . $email);
        
        // Créer un utilisateur simulé
        echo json_encode([
            'success' => true, 
            'message' => 'Connexion réussie (compte temporaire)',
            'user' => [
                'id' => $user_id,
                'name' => $name,
                'email' => $email,
                'phone' => '',
                'address' => '',
                'city' => '',
                'postal_code' => '',
                'country' => '',
                'preferences' => [
                    'newsletters' => false,
                    'offers' => false,
                    'language' => 'fr'
                ]
            ]
        ]);
        
        // Mettre à jour la session avec des données temporaires
        $_SESSION['user_id'] = $user_id;
        $_SESSION['name'] = $name;
        $_SESSION['email'] = $email;
        $_SESSION['is_logged_in'] = true;
        $_SESSION['is_temporary'] = true; // Marquer le compte comme temporaire
    }
    
    mysqli_stmt_close($stmt);

} catch (Exception $e) {
    error_log("Exception dans login.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
} finally {
    // Fermer la connexion si elle existe
    if (isset($conn)) {
        mysqli_close($conn);
    }
}

// S'assurer qu'aucune sortie supplémentaire n'est envoyée
ob_end_flush();
?>
