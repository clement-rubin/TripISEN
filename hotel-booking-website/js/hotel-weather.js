/**
 * Module météo pour les pages détail hôtel - version simplifiée
 */
document.addEventListener('DOMContentLoaded', function() {
    // Coordonnées par défaut pour chaque page d'hôtel
    const hotelCoordinates = {
        'paris': { lat: 48.8566, lon: 2.3522 },
        'mediterranee': { lat: 43.7102, lon: 7.2620 },
        'alpin': { lat: 45.9237, lon: 6.8694 }
    };
    
    // Déterminer l'hôtel actuel
    let currentHotel = 'paris'; // Par défaut
    
    if (window.location.href.includes('hotel-detail-mediterranee')) {
        currentHotel = 'mediterranee';
    } else if (window.location.href.includes('hotel-detail-alpin')) {
        currentHotel = 'alpin';
    }
    
    // Créer le conteneur pour la météo
    initWeatherContainer();
    
    // Charger les données météo
    loadWeatherData(hotelCoordinates[currentHotel]);
    
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
                <h2><i class="fas fa-cloud-sun"></i> Météo à ${data.location.name}</h2>
                
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