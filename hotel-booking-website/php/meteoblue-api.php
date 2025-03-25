<?php
// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Récupérer les paramètres
$lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
$lon = isset($_GET['lon']) ? floatval($_GET['lon']) : null;

// Vérifier les paramètres requis
if ($lat === null || $lon === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Les coordonnées lat/lon sont requises']);
    exit;
}

// Générer des données météo simulées - simplifié pour éviter les erreurs
try {
    $weatherData = generateSimulatedWeatherData($lat, $lon);
    echo json_encode($weatherData);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Génère des données météo simulées simplifiées
 */
function generateSimulatedWeatherData($lat, $lon) {
    // Déterminer la ville approximative
    $city = getApproximateCity($lat, $lon);
    
    // Températures de base selon la saison (simplifié)
    $baseTemp = date('n') >= 5 && date('n') <= 9 ? rand(20, 30) : rand(0, 15);
    
    // Conditions météo simplifiées
    $conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rainy'];
    $condition = $conditions[array_rand($conditions)];
    
    $descriptions = [
        'sunny' => 'Ensoleillé',
        'partly_cloudy' => 'Partiellement nuageux',
        'cloudy' => 'Nuageux',
        'rainy' => 'Pluvieux'
    ];
    
    $icons = [
        'sunny' => 'sun',
        'partly_cloudy' => 'cloud-sun',
        'cloudy' => 'cloud',
        'rainy' => 'cloud-rain'
    ];
    
    // Générer prévision simplifiée sur 3 jours
    $forecast = [];
    for ($i = 0; $i < 3; $i++) {
        $dayCondition = $conditions[array_rand($conditions)];
        $forecast[] = [
            'date' => date('Y-m-d', strtotime("+$i days")),
            'day' => [
                'temperature' => $baseTemp + rand(-3, 3),
                'condition' => $dayCondition,
                'description' => $descriptions[$dayCondition],
                'icon' => $icons[$dayCondition],
                'precipitation_probability' => rand(0, 100)
            ],
            'night' => [
                'temperature' => $baseTemp - rand(5, 10)
            ]
        ];
    }
    
    return [
        'location' => [
            'name' => $city,
            'country' => 'France',
            'latitude' => $lat,
            'longitude' => $lon
        ],
        'current' => [
            'temperature' => $baseTemp,
            'feels_like' => $baseTemp - 2,
            'condition' => $condition,
            'description' => $descriptions[$condition],
            'icon' => $icons[$condition],
            'humidity' => rand(30, 90),
            'wind_speed' => rand(5, 25),
            'visibility' => rand(5, 20),
            'updated_at' => date('Y-m-d H:i:s')
        ],
        'forecast' => $forecast
    ];
}

/**
 * Détermine une ville approximative basée sur les coordonnées
 */
function getApproximateCity($lat, $lon) {
    // Liste simplifiée des villes principales
    $cities = [
        ['name' => 'Paris', 'lat' => 48.8566, 'lon' => 2.3522],
        ['name' => 'Nice', 'lat' => 43.7102, 'lon' => 7.2620],
        ['name' => 'Chamonix', 'lat' => 45.9237, 'lon' => 6.8694],
        ['name' => 'Lyon', 'lat' => 45.7640, 'lon' => 4.8357],
        ['name' => 'Marseille', 'lat' => 43.2965, 'lon' => 5.3698]
    ];
    
    // Trouver la ville la plus proche
    $minDistance = PHP_FLOAT_MAX;
    $closestCity = 'Ville inconnue';
    
    foreach ($cities as $city) {
        // Calcul de distance simplifié
        $distance = sqrt(pow($lat - $city['lat'], 2) + pow($lon - $city['lon'], 2));
        if ($distance < $minDistance) {
            $minDistance = $distance;
            $closestCity = $city['name'];
        }
    }
    
    return $closestCity;
}
?>