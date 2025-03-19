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
error_log("update_profile.php appelé - Session ID: " . session_id());
error_log("Session: " . print_r($_SESSION, true));

// Vérifier la connexion
if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
    ob_end_flush();
    exit;
}

// Vérifier si l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    // Si l'utilisateur n'est pas connecté, vérifier s'il existe une connexion temporaire
    if (isset($_SESSION['temp_email']) && !empty($_SESSION['temp_email'])) {
        error_log("Mode temporaire détecté pour: " . $_SESSION['temp_email']);
        
        // Récupérer les données envoyées
        $data = json_decode(file_get_contents('php://input'), true);
        error_log("Données reçues en mode temporaire: " . print_r($data, true));
        
        if (!isset($data['name']) || !isset($data['email']) || empty($data['name']) || empty($data['email'])) {
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
            ob_end_flush();
            exit;
        }
        
        // Stocker les données dans la session temporaire
        $_SESSION['temp_name'] = $data['name'];
        $_SESSION['temp_email'] = $data['email'];
        $_SESSION['temp_phone'] = isset($data['phone']) ? $data['phone'] : '';
        $_SESSION['temp_address'] = isset($data['address']) ? $data['address'] : '';
        $_SESSION['temp_city'] = isset($data['city']) ? $data['city'] : '';
        $_SESSION['temp_postal_code'] = isset($data['postal_code']) ? $data['postal_code'] : '';
        $_SESSION['temp_country'] = isset($data['country']) ? $data['country'] : '';
        
        // Répondre avec succès pour les modifications temporaires
        echo json_encode([
            'success' => true,
            'message' => 'Profil mis à jour (mode temporaire)',
            'user' => [
                'name' => $_SESSION['temp_name'],
                'email' => $_SESSION['temp_email'],
                'phone' => $_SESSION['temp_phone'],
                'address' => $_SESSION['temp_address'],
                'city' => $_SESSION['temp_city'],
                'postal_code' => $_SESSION['temp_postal_code'],
                'country' => $_SESSION['temp_country']
            ]
        ]);
        ob_end_flush();
        exit;
    }
    
    // Si l'utilisateur n'est pas connecté et pas de session temporaire, renvoyer une erreur
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    ob_end_flush();
    exit;
}

// Vérifier si c'est un compte temporaire (simulé)
$isTemporary = isset($_SESSION['is_temporary']) && $_SESSION['is_temporary'] === true;
error_log("Compte temporaire: " . ($isTemporary ? "Oui" : "Non"));

// Vérifier si la requête est de type POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        // Récupérer le contenu JSON envoyé
        $rawData = file_get_contents('php://input');
        error_log("Données brutes reçues: " . $rawData);
        
        $data = json_decode($rawData, true);
        
        // Valider les données reçues
        if (!isset($data['name']) || !isset($data['email']) || empty($data['name']) || empty($data['email'])) {
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
            ob_end_flush();
            exit;
        }
        
        // Récupérer l'ID de l'utilisateur connecté
        $user_id = $_SESSION['user_id'];
        
        // Préparer les données pour la mise à jour
        $name = mysqli_real_escape_string($conn, $data['name']);
        $email = mysqli_real_escape_string($conn, $data['email']);
        
        // Vérifier si l'utilisateur existe dans la base de données
        $userCheckQuery = "SELECT id FROM users WHERE id = ?";
        $userCheckStmt = mysqli_prepare($conn, $userCheckQuery);
        mysqli_stmt_bind_param($userCheckStmt, "i", $user_id);
        mysqli_stmt_execute($userCheckStmt);
        mysqli_stmt_store_result($userCheckStmt);
        $userExists = mysqli_stmt_num_rows($userCheckStmt) > 0;
        mysqli_stmt_close($userCheckStmt);
        
        // Si l'utilisateur n'existe pas et que c'est un compte temporaire, le créer
        if (!$userExists && $isTemporary) {
            $createUserQuery = "INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, NOW())";
            $createUserStmt = mysqli_prepare($conn, $createUserQuery);
            mysqli_stmt_bind_param($createUserStmt, "iss", $user_id, $name, $email);
            $userCreated = mysqli_stmt_execute($createUserStmt);
            mysqli_stmt_close($createUserStmt);
            
            if (!$userCreated) {
                throw new Exception("Impossible de créer l'utilisateur dans la base de données: " . mysqli_error($conn));
            }
            
            error_log("Utilisateur temporaire créé dans la base de données: ID=$user_id, Email=$email");
        }
        
        // Vérifier et créer les colonnes manquantes si nécessaire
        $tableInfoQuery = "DESCRIBE users";
        $tableInfo = mysqli_query($conn, $tableInfoQuery);
        
        if (!$tableInfo) {
            throw new Exception("Erreur lors de la récupération de la structure de la table: " . mysqli_error($conn));
        }
        
        // Collecter les noms de colonnes existantes
        $existingColumns = [];
        while ($column = mysqli_fetch_assoc($tableInfo)) {
            $existingColumns[] = $column['Field'];
        }
        
        // Créer les colonnes manquantes si nécessaire
        $optionalColumns = ['phone', 'address', 'city', 'postal_code', 'country'];
        foreach ($optionalColumns as $column) {
            if (!in_array($column, $existingColumns)) {
                $alterQuery = "ALTER TABLE users ADD COLUMN $column VARCHAR(255)";
                mysqli_query($conn, $alterQuery);
                error_log("Colonne ajoutée: $column");
                $existingColumns[] = $column; // Ajouter à la liste des colonnes existantes
            }
        }
        
        // Construire la requête SQL en fonction des colonnes existantes
        $queryParts = ["name = '$name'", "email = '$email'"];
        
        // Ajouter les champs optionnels s'ils existent dans la table
        $optionalFields = [
            'phone' => isset($data['phone']) ? mysqli_real_escape_string($conn, $data['phone']) : '',
            'address' => isset($data['address']) ? mysqli_real_escape_string($conn, $data['address']) : '',
            'city' => isset($data['city']) ? mysqli_real_escape_string($conn, $data['city']) : '',
            'postal_code' => isset($data['postal_code']) ? mysqli_real_escape_string($conn, $data['postal_code']) : '',
            'country' => isset($data['country']) ? mysqli_real_escape_string($conn, $data['country']) : ''
        ];
        
        foreach ($optionalFields as $field => $value) {
            if (in_array($field, $existingColumns)) {
                // Toujours inclure les champs, même s'ils sont vides
                $queryParts[] = "$field = '$value'";
            }
        }
        
        // Construire la requête finale
        $query = "UPDATE users SET " . implode(", ", $queryParts) . " WHERE id = $user_id";
        error_log("Requête de mise à jour: " . $query);
        
        if (mysqli_query($conn, $query)) {
            // Mettre à jour les informations de session
            $_SESSION['name'] = $name;
            $_SESSION['email'] = $email;
            // Si c'était un compte temporaire, il ne l'est plus
            if (isset($_SESSION['is_temporary'])) {
                $_SESSION['is_temporary'] = false;
            }
            
            // Renvoyer une réponse de succès
            echo json_encode([
                'success' => true, 
                'message' => 'Profil mis à jour avec succès',
                'user' => array_merge([
                    'id' => $user_id,
                    'name' => $name,
                    'email' => $email
                ], $optionalFields)
            ]);
            error_log("Profil mis à jour avec succès pour l'utilisateur ID: " . $user_id);
        } else {
            throw new Exception("Erreur lors de la mise à jour: " . mysqli_error($conn));
        }
    } catch (Exception $e) {
        error_log("Exception dans update_profile.php: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    // Si la méthode n'est pas POST, renvoyer une erreur
    error_log("Méthode non autorisée: " . $_SERVER['REQUEST_METHOD']);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}

// Fermer la connexion
mysqli_close($conn);

// S'assurer qu'aucune sortie supplémentaire n'est envoyée
ob_end_flush();
?>
