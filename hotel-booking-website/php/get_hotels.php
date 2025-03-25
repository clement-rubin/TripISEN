<?php
// filepath: c:\MAMP\htdocs\Nouveau dossier (6)\TripISEN\hotel-booking-website\php\get_hotel_details.php
// Inclure le fichier de connexion à la base de données
require_once 'db_connect.php';

// Configuration des en-têtes pour les réponses JSON
header('Content-Type: application/json');

// Vérifier si un ID d'hôtel est fourni
if (!isset($_GET['id']) || empty($_GET['id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'ID d\'hôtel non spécifié'
    ]);
    exit;
}

try {
    // Récupérer l'ID de l'hôtel et s'assurer qu'il est numérique
    $hotelId = intval($_GET['id']);
    
    // Préparer et exécuter la requête pour obtenir les détails de l'hôtel
    $query = "
        SELECT h.*, 
               COUNT(DISTINCT r.room_id) as room_count,
               MIN(rc.price_per_night) as min_price,
               MAX(rc.price_per_night) as max_price
        FROM hotels h
        LEFT JOIN rooms r ON h.hotel_id = r.hotel_id
        LEFT JOIN room_categories rc ON r.category_id = rc.category_id
        WHERE h.hotel_id = ?
        GROUP BY h.hotel_id
    ";
    
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        throw new Exception($conn->error);
    }
    
    $stmt->bind_param('i', $hotelId);
    
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Hôtel non trouvé'
        ]);
        exit;
    }
    
    // Récupérer les détails de l'hôtel
    $hotel = $result->fetch_assoc();
    
    // Récupérer les catégories de chambres disponibles
    $roomQuery = "
        SELECT rc.*,
               COUNT(r.room_id) as available_rooms
        FROM room_categories rc
        JOIN rooms r ON rc.category_id = r.category_id
        WHERE r.hotel_id = ? AND r.is_available = true
        GROUP BY rc.category_id
    ";
    
    $roomStmt = $conn->prepare($roomQuery);
    
    if ($roomStmt === false) {
        throw new Exception($conn->error);
    }
    
    $roomStmt->bind_param('i', $hotelId);
    
    if (!$roomStmt->execute()) {
        throw new Exception($roomStmt->error);
    }
    
    $roomResult = $roomStmt->get_result();
    
    $roomCategories = [];
    while ($category = $roomResult->fetch_assoc()) {
        $roomCategories[] = $category;
    }
    
    // Ajouter les catégories de chambres à l'objet hôtel
    $hotel['room_categories'] = $roomCategories;
    
    // Renvoyer les détails de l'hôtel en format JSON
    echo json_encode([
        'success' => true,
        'hotel' => $hotel
    ]);
    
} catch (Exception $e) {
    // En cas d'erreur, renvoyer un message d'erreur
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des détails de l\'hôtel: ' . $e->getMessage()
    ]);
}
?>