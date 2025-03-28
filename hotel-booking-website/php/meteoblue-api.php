<?php
// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Système de logs
function logMessage($message, $type = 'INFO') {
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/weather_api_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$type] $message" . PHP_EOL;
    
    // Écrire dans le fichier de log
    file_put_contents($logFile, $logEntry, FILE_APPEND);
    
    // Si c'est une erreur, afficher également dans le log PHP
    if ($type === 'ERROR') {
        error_log("MeteoblueAPI: $message");
    }
}

header('Content-Type: application/json');

// Récupérer les paramètres
$lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
$lon = isset($_GET['lon']) ? floatval($_GET['lon']) : null;
$forceRefresh = isset($_GET['refresh']) && $_GET['refresh'] === 'true';

logMessage("Nouvelle requête météo pour lat=$lat, lon=$lon");

// Vérifier les paramètres requis
if ($lat === null || $lon === null) {
    logMessage("Paramètres manquants: lat ou lon", "ERROR");
    http_response_code(400);
    echo json_encode(['error' => 'Les coordonnées lat/lon sont requises']);
    exit;
}

// Définir le fichier de cache
$cacheDir = __DIR__ . '/../cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}
$cacheFile = $cacheDir . '/weather_' . md5($lat . '_' . $lon) . '.json';
$cacheExpiry = 3600; // 1 heure en secondes

// Vérifier si le cache existe et est valide
if (!$forceRefresh && file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheExpiry)) {
    logMessage("Utilisation des données en cache pour lat=$lat, lon=$lon (cache créé le " . date('Y-m-d H:i:s', filemtime($cacheFile)) . ")");
    echo file_get_contents($cacheFile);
    exit;
}

// Si on arrive ici, c'est que le cache n'est pas utilisé
logMessage("Cache ignoré ou expiré, appel à l'API requis");

// Clé API Météo Blue - OBTENIR VOTRE PROPRE CLÉ GRATUITE SUR https://content.meteoblue.com/en/access-options/meteoblue-api
$apiKey = 'N5FAOaXmTjBiv904'; // Remplacez par votre clé API Météo Blue
logMessage("Appel à l'API Meteoblue pour lat=$lat, lon=$lon");

// Appel à l'API Météo Blue
try {
    // URL de l'API Météo Blue (package 3 days forecast)
    $apiUrl = "https://my.meteoblue.com/packages/basic-1h_basic-day?apikey=$apiKey";
    
    // Paramètres de l'API
    $params = [
        'lat' => $lat,
        'lon' => $lon,
        'asl' => 0, // Altitude en mètres (auto-détecté par défaut)
        'format' => 'json',
        'temperature' => 'C', // Celsius
        'windspeed' => 'kmh', // km/h
        'winddirection' => 'degree', // Degrés
        'precipitationamount' => 'mm', // Millimètres
        'timeformat' => 'iso8601', // Format de date ISO
        'timezone' => 'Europe/Paris' // Fuseau horaire
    ];
    
    // Construction de l'URL complète
    $queryString = http_build_query($params);
    $fullUrl = "$apiUrl&$queryString";
    
    logMessage("URL de requête API : " . preg_replace('/apikey=[^&]+/', 'apikey=***', $fullUrl)); // Masquer la clé API dans les logs
    
    // Options pour le contexte HTTP
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => [
                'User-Agent: TripISEN/1.0',
                'Accept: application/json'
            ],
            'timeout' => 10 // Timeout en secondes
        ]
    ];
    $context = stream_context_create($opts);
    
    // Début du chronomètre pour mesurer le temps de réponse
    $startTime = microtime(true);
    
    // Appel à l'API
    $response = file_get_contents($fullUrl, false, $context);
    
    // Temps de réponse
    $responseTime = round((microtime(true) - $startTime) * 1000); // en millisecondes
    logMessage("API a répondu en $responseTime ms");
    
    if ($response === false) {
        $error = error_get_last();
        throw new Exception("Erreur lors de l'appel à l'API: " . ($error['message'] ?? 'Erreur inconnue'));
    }
    
    // Décodage de la réponse
    $data = json_decode($response, true);
    if (!$data) {
        throw new Exception("Erreur lors du décodage de la réponse JSON: " . json_last_error_msg());
    }
    
    logMessage("Réponse API reçue avec succès. " . (isset($data['metadata']['name']) ? "Ville: " . $data['metadata']['name'] : "Ville non spécifiée"));
    
    // Formater les données dans notre format attendu
    $weatherData = formatMeteoBlueData($data, $lat, $lon);
    
    // Stocker dans le cache
    file_put_contents($cacheFile, json_encode($weatherData));
    logMessage("Nouvelles données météo mises en cache");
    
    echo json_encode($weatherData);
} catch (Exception $e) {
    // En cas d'erreur, on utilise des données de secours
    logMessage("ERREUR: " . $e->getMessage(), "ERROR");
    logMessage("Utilisation des données de secours", "WARNING");
    
    $fallbackData = generateFallbackWeatherData($lat, $lon);
    file_put_contents($cacheFile, json_encode($fallbackData)); // Même en cas d'erreur, on cache le fallback
    
    echo json_encode([
        'error' => $e->getMessage(),
        'data' => $fallbackData
    ]);
}

/**
 * Formate les données API Météo Blue dans notre format attendu
 */
function formatMeteoBlueData($data, $lat, $lon) {
    // Extraire le nom de la ville du champ metadata
    $cityName = $data['metadata']['name'] ?? getApproximateCity($lat, $lon);
    $country = $data['metadata']['country'] ?? 'FR';
    
    // Données actuelles (première heure des prévisions)
    $currentData = [
        'temperature' => round($data['data_1h']['temperature'][0] ?? 20),
        'feels_like' => round($data['data_1h']['felttemperature'][0] ?? 20),
        'humidity' => round($data['data_1h']['relativehumidity'][0] ?? 60),
        'wind_speed' => round($data['data_1h']['windspeed'][0] ?? 10),
        'visibility' => calculateVisibility($data['data_1h']['precipitation'][0] ?? 0, $data['data_1h']['relativehumidity'][0] ?? 60)
    ];
    
    // Déterminer les conditions météo actuelles
    $precipitationNow = $data['data_1h']['precipitation'][0] ?? 0;
    $cloudcoverNow = $data['data_1h']['cloudcover'][0] ?? 0;
    $snowfractionNow = $data['data_1h']['snowfraction'][0] ?? 0;
    
    $currentCondition = determineWeatherCondition($precipitationNow, $cloudcoverNow, $snowfractionNow);
    $currentIcon = getWeatherIcon($currentCondition);
    $currentDescription = getWeatherDescription($currentCondition);
    
    // Préparer les prévisions pour les 3 prochains jours
    $forecast = [];
    
    for ($i = 0; $i < 3 && $i < count($data['data_day']); $i++) {
        $dayData = $data['data_day'][$i];
        
        // Déterminer les conditions météo pour ce jour
        $precipDay = $dayData['precipitation'] ?? 0;
        $cloudcoverDay = $dayData['cloudcover'] ?? 0;
        $snowfractionDay = $dayData['snowfraction'] ?? 0;
        
        $dayCondition = determineWeatherCondition($precipDay, $cloudcoverDay, $snowfractionDay);
        $dayIcon = getWeatherIcon($dayCondition);
        $dayDescription = getWeatherDescription($dayCondition);
        
        // Date au format YYYY-MM-DD
        $forecastDate = date('Y-m-d', strtotime("+" . $i . " days"));
        
        $forecast[] = [
            'date' => $forecastDate,
            'day' => [
                'temperature' => round($dayData['temperature_max'] ?? 20),
                'condition' => $dayCondition,
                'description' => $dayDescription,
                'icon' => $dayIcon,
                'precipitation_probability' => round($dayData['precipitation_probability'] ?? ($precipDay > 0 ? 70 : 10))
            ],
            'night' => [
                'temperature' => round($dayData['temperature_min'] ?? 10)
            ]
        ];
    }
    
    logMessage("Formatage des données terminé. Température actuelle: " . $currentData['temperature'] . "°C");
    
    return [
        'location' => [
            'name' => $cityName,
            'country' => $country,
            'latitude' => $lat,
            'longitude' => $lon
        ],
        'current' => [
            'temperature' => $currentData['temperature'],
            'feels_like' => $currentData['feels_like'],
            'condition' => $currentCondition,
            'description' => $currentDescription,
            'icon' => $currentIcon,
            'humidity' => $currentData['humidity'],
            'wind_speed' => $currentData['wind_speed'],
            'visibility' => $currentData['visibility'],
            'updated_at' => date('Y-m-d H:i:s')
        ],
        'forecast' => $forecast
    ];
}

/**
 * Déterminer la condition météo en fonction des précipitations, couverture nuageuse et fraction de neige
 */
function determineWeatherCondition($precipitation, $cloudcover, $snowfraction) {
    if ($precipitation > 0 && $snowfraction > 0.5) {
        return 'snowy';
    } else if ($precipitation > 5) {
        return 'stormy';
    } else if ($precipitation > 0) {
        return 'rainy';
    } else if ($cloudcover > 80) {
        return 'cloudy';
    } else if ($cloudcover > 40) {
        return 'partly_cloudy';
    } else {
        return 'sunny';
    }
}

/**
 * Obtenir l'icône FontAwesome correspondant à la condition météo
 */
function getWeatherIcon($condition) {
    $icons = [
        'sunny' => 'sun',
        'partly_cloudy' => 'cloud-sun',
        'cloudy' => 'cloud',
        'rainy' => 'cloud-rain',
        'stormy' => 'bolt',
        'snowy' => 'snowflake',
        'foggy' => 'smog'
    ];
    
    return $icons[$condition] ?? 'question';
}

/**
 * Obtenir une description textuelle de la condition météo
 */
function getWeatherDescription($condition) {
    $descriptions = [
        'sunny' => 'Ensoleillé',
        'partly_cloudy' => 'Partiellement nuageux',
        'cloudy' => 'Nuageux',
        'rainy' => 'Pluvieux',
        'stormy' => 'Orageux',
        'snowy' => 'Neigeux',
        'foggy' => 'Brumeux'
    ];
    
    return $descriptions[$condition] ?? 'Indéterminé';
}

/**
 * Calculer une visibilité approximative basée sur les précipitations et l'humidité
 */
function calculateVisibility($precipitation, $humidity) {
    // Estimation grossière: moins de visibilité en cas de précipitations et forte humidité
    $baseVisibility = 10; // 10 km par beau temps
    
    if ($precipitation > 5) {
        $baseVisibility = 3; // Forte pluie
    } else if ($precipitation > 0) {
        $baseVisibility = 5; // Pluie légère
    }
    
    // Réduire davantage si l'humidité est très élevée
    if ($humidity > 90) {
        $baseVisibility -= 2;
    } else if ($humidity > 80) {
        $baseVisibility -= 1;
    }
    
    return max(1, $baseVisibility); // Minimum 1 km de visibilité
}

/**
 * Génère des données météo de secours en cas d'échec de l'API
 */
function generateFallbackWeatherData($lat, $lon) {
    $city = getApproximateCity($lat, $lon);
    
    // Utiliser les coordonnées comme seed pour la pseudo-randomisation
    $seed = intval(($lat * 100) + ($lon * 100) + date('z'));
    mt_srand($seed);
    
    // Données déterministes pour que ça ne change pas à chaque rafraîchissement
    $forecast = [];
    for ($i = 0; $i < 3; $i++) {
        $daySeed = $seed + ($i * 100);
        mt_srand($daySeed);
        
        $dayTemp = 20 + mt_rand(-5, 5);
        $nightTemp = $dayTemp - mt_rand(5, 10);
        
        $conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rainy'];
        $condition = $conditions[$daySeed % 4];
        
        $forecast[] = [
            'date' => date('Y-m-d', strtotime("+" . $i . " days")),
            'day' => [
                'temperature' => $dayTemp,
                'condition' => $condition,
                'description' => getWeatherDescription($condition),
                'icon' => getWeatherIcon($condition),
                'precipitation_probability' => ($condition == 'rainy' ? 70 : ($condition == 'cloudy' ? 30 : 10))
            ],
            'night' => [
                'temperature' => $nightTemp
            ]
        ];
    }
    
    // Données actuelles déterministes
    mt_srand($seed);
    $currentCondition = $forecast[0]['day']['condition'];
    
    logMessage("Données de secours générées pour " . $city . ". Température: " . $forecast[0]['day']['temperature'] . "°C");
    
    return [
        'location' => [
            'name' => $city,
            'country' => 'France',
            'latitude' => $lat,
            'longitude' => $lon
        ],
        'current' => [
            'temperature' => $forecast[0]['day']['temperature'],
            'feels_like' => $forecast[0]['day']['temperature'] - mt_rand(0, 2),
            'condition' => $currentCondition,
            'description' => getWeatherDescription($currentCondition),
            'icon' => getWeatherIcon($currentCondition),
            'humidity' => 60 + ($seed % 30),
            'wind_speed' => 10 + ($seed % 15),
            'visibility' => 10,
            'updated_at' => date('Y-m-d H:i:s')
        ],
        'forecast' => $forecast
    ];
}

/**
 * Détermine une ville approximative basée sur les coordonnées
 */
function getApproximateCity($lat, $lon) {
    // Liste des villes principales avec leur coordonnées précises
    $cities = [
        ['name' => 'Paris', 'lat' => 48.8566, 'lon' => 2.3522],
        ['name' => 'Nice', 'lat' => 43.7102, 'lon' => 7.2620],
        ['name' => 'Chamonix', 'lat' => 45.9237, 'lon' => 6.8694],
        ['name' => 'Lyon', 'lat' => 45.7640, 'lon' => 4.8357],
        ['name' => 'Marseille', 'lat' => 43.2965, 'lon' => 5.3698],
        ['name' => 'Bordeaux', 'lat' => 44.8378, 'lon' => -0.5792],
        ['name' => 'Lille', 'lat' => 50.6292, 'lon' => 3.0573],
        ['name' => 'Strasbourg', 'lat' => 48.5734, 'lon' => 7.7521],
        ['name' => 'Londres', 'lat' => 51.5074, 'lon' => -0.1278],
        ['name' => 'Genève', 'lat' => 46.2044, 'lon' => 6.1432],
        ['name' => 'Cannes', 'lat' => 43.5528, 'lon' => 7.0174],
        ['name' => 'Annecy', 'lat' => 45.899, 'lon' => 6.1292]
    ];
    
    // Trouver la ville la plus proche avec une meilleure précision
    $minDistance = PHP_FLOAT_MAX;
    $closestCity = 'Ville inconnue';
    
    foreach ($cities as $city) {
        // Calcul de distance en utilisant la formule haversine (plus précise)
        $earthRadius = 6371; // Rayon de la Terre en km
        $latDiff = deg2rad($city['lat'] - $lat);
        $lonDiff = deg2rad($city['lon'] - $lon);
        $a = sin($latDiff/2) * sin($latDiff/2) + cos(deg2rad($lat)) * cos(deg2rad($city['lat'])) * sin($lonDiff/2) * sin($lonDiff/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        $distance = $earthRadius * $c;
        
        if ($distance < $minDistance) {
            $minDistance = $distance;
            $closestCity = $city['name'];
        }
    }
    
    // Si très proche de la ville (moins de 5km), on utilise son nom
    if ($minDistance < 5) {
        return $closestCity;
    } else {
        // Sinon, on ajoute "près de" pour indiquer la proximité
        return 'Région de ' . $closestCity;
    }
}
?>