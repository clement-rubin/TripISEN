<?php
// Ce script ajoute les colonnes manquantes à la table users

// Inclure la connexion à la base de données
require_once 'db_connect.php';

// Vérifier la connexion
if (!$conn) {
    die("Connexion à la base de données échouée");
}

// Les colonnes à vérifier/ajouter et leurs types SQL
$columns = [
    'phone' => 'VARCHAR(20)',
    'address' => 'VARCHAR(255)',
    'city' => 'VARCHAR(100)',
    'postal_code' => 'VARCHAR(20)',
    'country' => 'VARCHAR(100)'
];

// Récupérer les informations de la table users
$tableInfoQuery = "DESCRIBE users";
$tableInfo = mysqli_query($conn, $tableInfoQuery);

if (!$tableInfo) {
    die("Erreur lors de la récupération de la structure de la table: " . mysqli_error($conn));
}

// Collecter les noms de colonnes existantes
$existingColumns = [];
while ($column = mysqli_fetch_assoc($tableInfo)) {
    $existingColumns[] = $column['Field'];
}

echo "<h1>Ajout des colonnes manquantes à la table users</h1>";

// Vérifier et ajouter chaque colonne si elle n'existe pas
foreach ($columns as $columnName => $columnType) {
    if (!in_array($columnName, $existingColumns)) {
        $alterQuery = "ALTER TABLE users ADD COLUMN $columnName $columnType";
        if (mysqli_query($conn, $alterQuery)) {
            echo "<p style='color:green'>Colonne '$columnName' ajoutée avec succès.</p>";
        } else {
            echo "<p style='color:red'>Erreur lors de l'ajout de la colonne '$columnName': " . mysqli_error($conn) . "</p>";
        }
    } else {
        echo "<p>La colonne '$columnName' existe déjà.</p>";
    }
}

// Vérifier la table user_preferences
$prefsTableQuery = "SHOW TABLES LIKE 'user_preferences'";
$prefsTableResult = mysqli_query($conn, $prefsTableQuery);

if (mysqli_num_rows($prefsTableResult) == 0) {
    // Créer la table user_preferences
    $createTableQuery = "
    CREATE TABLE user_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        newsletters TINYINT(1) DEFAULT 0,
        offers TINYINT(1) DEFAULT 0,
        language VARCHAR(10) DEFAULT 'fr',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    
    if (mysqli_query($conn, $createTableQuery)) {
        echo "<p style='color:green'>Table 'user_preferences' créée avec succès.</p>";
    } else {
        echo "<p style='color:red'>Erreur lors de la création de la table 'user_preferences': " . mysqli_error($conn) . "</p>";
    }
} else {
    echo "<p>La table 'user_preferences' existe déjà.</p>";
}

echo "<p><a href='../profile.html'>Retour au profil</a></p>";

// Fermer la connexion
mysqli_close($conn);
?>
