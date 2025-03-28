/**
 * Module météo pour les pages détail hôtel
 */
document.addEventListener('DOMContentLoaded', function() {
    // Coordonnées par défaut pour chaque page d'hôtel
    const hotelCoordinates = {
        'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
        'mediterranee': { lat: 43.7102, lon: 7.2620, name: 'Nice' },
        'alpin': { lat: 45.9237, lon: 6.8694, name: 'Chamonix' },
        'london': { lat: 51.5074, lon: -0.1278, name: 'Londres' }
    };
    
    // Déterminer l'hôtel actuel de façon plus robuste
    let currentHotel = detectCurrentHotel();
    
    // Créer le conteneur pour la météo
    initWeatherContainer();
    
    // Charger les données météo
    loadWeatherData(hotelCoordinates[currentHotel]);
    
    /**
     * Détecte l'hôtel actuel en se basant sur plusieurs indicateurs
     */
    function detectCurrentHotel() {
        // 1. Vérifier d'abord les data-attributes (prioritaire)
        const hotelInfo = document.querySelector('[data-hotel-coordinates]');
        if (hotelInfo) {
            try {
                const coords = JSON.parse(hotelInfo.dataset.hotelCoordinates);
                if (coords && coords.lat && coords.lon) {
                    // Ajouter dynamiquement au dictionnaire des coordonnées
                    const hotelId = hotelInfo.dataset.hotelId || 'custom';
                    hotelCoordinates[hotelId] = coords;
                    return hotelId;
                }
            } catch (e) {
                console.error('Erreur de parsing des coordonnées:', e);
            }
        }
        
        // 2. Vérifier l'URL pour détecter l'hôtel
        const url = window.location.href.toLowerCase();
        
        if (url.includes('hotel-detail-mediterranee') || url.includes('nice')) {
            return 'mediterranee';
        } else if (url.includes('hotel-detail-alpin') || url.includes('chamonix')) {
            return 'alpin';
        } else if (url.includes('london') || url.includes('westminster')) {
            return 'london';
        } else if (url.includes('paris') || url.includes('luxe')) {
            return 'paris';
        }
        
        // 3. Essayer de détecter à partir du contenu de la page
        const pageContent = document.body.textContent.toLowerCase();
        if (pageContent.includes('nice') || pageContent.includes('méditerranée')) {
            return 'mediterranee';
        } else if (pageContent.includes('chamonix') || pageContent.includes('alpin')) {
            return 'alpin';
        } else if (pageContent.includes('londres') || pageContent.includes('london')) {
            return 'london';
        }
        
        // Par défaut, utiliser Paris
        return 'paris';
    }
    
    /**
     * Crée et insère le conteneur météo dans la page
     */
    function initWeatherContainer() {
        // Vérifier si le conteneur existe déjà
        if (document.querySelector('.hotel-weather-container')) {
            return;
        }
        
        // Créer le conteneur
        const weatherContainer = document.createElement('div');
        weatherContainer.className = 'hotel-weather-container';
        weatherContainer.innerHTML = `
            <div class="section weather-section loading">
                <h2><i class="fas fa-cloud-sun"></i> Météo locale</h2>
                <div class="weather-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Chargement des prévisions météo...</p>
                </div>
            </div>
        `;
        
        // Insérer après la description de l'hôtel
        const targetSection = document.querySelector('.section.description') || 
                             document.querySelector('.hotel-main');
        
        if (targetSection) {
            targetSection.parentNode.insertBefore(weatherContainer, targetSection.nextSibling);
        }
    }
    
    /**
     * Charge les données météo depuis l'API
     */
    function loadWeatherData(coordinates) {
        if (!coordinates) {
            showError("Données de localisation non disponibles");
            return;
        }
        
        fetch(`php/meteoblue-api.php?lat=${coordinates.lat}&lon=${coordinates.lon}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                displayWeatherData(data);
            })
            .catch(error => {
                console.error('Erreur:', error);
                showError("Impossible de charger les données météo");
            });
    }
    
    /**
     * Affiche un message d'erreur
     */
    function showError(message) {
        const container = document.querySelector('.hotel-weather-container');
        if (container) {
            container.innerHTML = `
                <div class="section weather-section error">
                    <h2><i class="fas fa-cloud-sun"></i> Météo locale</h2>
                    <div class="weather-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>${message}</p>
                        <button id="retry-weather" class="btn btn-secondary">Réessayer</button>
                    </div>
                </div>
            `;
            
            document.getElementById('retry-weather')?.addEventListener('click', function() {
                container.innerHTML = `
                    <div class="section weather-section loading">
                        <h2><i class="fas fa-cloud-sun"></i> Météo locale</h2>
                        <div class="weather-loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Chargement des prévisions météo...</p>
                        </div>
                    </div>
                `;
                loadWeatherData(hotelCoordinates[currentHotel]);
            });
        }
    }
    
    /**
     * Affiche les données météo
     */
    function displayWeatherData(data) {
        if (!data || !data.current) {
            showError("Format de données météo invalide");
            return;
        }
        
        const container = document.querySelector('.hotel-weather-container');
        if (!container) return;
        
        // Récupérer le nom personnalisé de la ville si disponible
        const hotelInfo = document.querySelector('[data-hotel-coordinates]');
        let cityName = data.location.name;
        
        if (hotelInfo && hotelInfo.dataset.hotelCoordinates) {
            try {
                const coords = JSON.parse(hotelInfo.dataset.hotelCoordinates);
                if (coords.name) {
                    cityName = coords.name;
                }
            } catch (e) {
                console.error('Erreur lors de la récupération du nom de la ville:', e);
            }
        }
        
        // Si le nom de la ville est vide, utiliser celui de l'hôtel actuel
        if (!cityName && hotelCoordinates[currentHotel]) {
            cityName = hotelCoordinates[currentHotel].name;
        }
        
        // Construire l'HTML pour la prévision
        let forecastHtml = '';
        if (data.forecast && data.forecast.length) {
            forecastHtml = `
                <div class="weather-forecast">
                    ${data.forecast.map(day => `
                        <div class="forecast-day">
                            <div class="forecast-date">${formatDate(day.date)}</div>
                            <div class="forecast-icon">
                                <i class="fas fa-${day.day.icon || 'cloud'}"></i>
                            </div>
                            <div class="forecast-temp">
                                <span class="temp-max">${Math.round(day.day.temperature)}°</span>
                                <span class="temp-min">${Math.round(day.night.temperature)}°</span>
                            </div>
                            <div class="forecast-desc">${day.day.description}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Mettre à jour le conteneur avec les données météo
        container.innerHTML = `
            <div class="section weather-section">
                <h2><i class="fas fa-cloud-sun"></i> Météo à ${cityName || data.location.name}</h2>
                
                <div class="weather-content">
                    <div class="weather-current">
                        <div class="weather-header">
                            <div class="weather-icon">
                                <i class="fas fa-${data.current.icon || 'sun'}"></i>
                            </div>
                            <div class="weather-info">
                                <div class="weather-temp">${Math.round(data.current.temperature)}°C</div>
                                <div class="weather-desc">${data.current.description}</div>
                            </div>
                        </div>
                        
                        <div class="weather-details">
                            <div class="weather-detail-item">
                                <i class="fas fa-temperature-low"></i>
                                <span>Ressenti: ${Math.round(data.current.feels_like)}°C</span>
                            </div>
                            <div class="weather-detail-item">
                                <i class="fas fa-wind"></i>
                                <span>Vent: ${data.current.wind_speed} km/h</span>
                            </div>
                            <div class="weather-detail-item">
                                <i class="fas fa-tint"></i>
                                <span>Humidité: ${data.current.humidity}%</span>
                            </div>
                            <div class="weather-detail-item">
                                <i class="fas fa-eye"></i>
                                <span>Visibilité: ${data.current.visibility} km</span>
                            </div>
                        </div>
                    </div>
                    
                    ${forecastHtml}
                    
                    <div class="weather-footer">
                        <div class="weather-updated">Mis à jour le ${formatDateTime(data.current.updated_at)}</div>
                        <a href="https://meteoblue.com" target="_blank" class="weather-attribution">
                            Fourni par <span>meteoblue</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Formate une date (YYYY-MM-DD) en format court
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { weekday: 'short', day: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    }
    
    /**
     * Formate une date-heure complète
     */
    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});