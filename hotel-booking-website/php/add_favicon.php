<?php
// Ce script ajoute automatiquement la balise favicon à tous les fichiers HTML

$directory = dirname(__DIR__); // Remonte d'un niveau à partir du dossier php
$files = glob($directory . '/*.html');

// Le pattern à rechercher dans les fichiers HTML
$faviconTag = '<link rel="icon" href="assets/images/logo.png">';

// Compteur pour suivre le nombre de fichiers modifiés
$count = 0;

foreach ($files as $file) {
    // Lire le contenu du fichier
    $content = file_get_contents($file);
    
    // Vérifier si la balise favicon est déjà présente
    if (strpos($content, $faviconTag) !== false) {
        echo basename($file) . " : Le favicon est déjà présent.<br>";
        continue;
    }
    
    // Chercher la position de fermeture de la balise title
    $pos = strpos($content, '</title>');
    if ($pos !== false) {
        // Insérer la balise favicon après la balise title
        $newContent = substr($content, 0, $pos + 8) . "\n    " . $faviconTag . substr($content, $pos + 8);
        file_put_contents($file, $newContent);
        $count++;
        echo basename($file) . " : Favicon ajouté avec succès.<br>";
    } else {
        echo basename($file) . " : Balise title non trouvée, favicon non ajouté.<br>";
    }
}

echo "<p>Opération terminée. $count fichiers ont été modifiés.</p>";
echo "<p><a href='../index.html'>Retour à l'accueil</a></p>";
?>
