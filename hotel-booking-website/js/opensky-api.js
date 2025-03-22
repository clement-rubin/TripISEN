/**
 * Module pour interagir avec l'API OpenSky Network
 */
export default class OpenSkyAPI {
    /**
     * Crée une instance de l'API OpenSky
     * @param {string} username - Nom d'utilisateur OpenSky
     * @param {string} password - Mot de passe OpenSky
     */
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.baseUrl = 'https://opensky-network.org/api';
    }
    
    /**
     * Récupère les options pour les requêtes fetch
     * @returns {Object} Options pour fetch
     */
    getRequestOptions() {
        const options = {
            method: 'GET'
        };
        
        if (this.username && this.password) {
            const auth = btoa(`${this.username}:${this.password}`);
            options.headers = {
                'Authorization': `Basic ${auth}`
            };
        }
        
        return options;
    }
    
    /**
     * Effectue un appel API avec gestion des limites de taux
     * @param {string} endpoint - Point de terminaison API
     * @param {Object} params - Paramètres de requête
     * @returns {Promise<Object>} Données de réponse
     */
    async callApi(endpoint, params = {}) {
        // Construire l'URL avec les paramètres
        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
            try {
                const response = await fetch(url.toString(), this.getRequestOptions());
                
                // Gestion des limites de taux
                if (response.status === 429) {
                    console.log("Limite de taux atteinte, attente avant de réessayer...");
                    await new Promise(resolve => setTimeout(resolve, 2000 * (retries + 1)));
                    retries++;
                    continue;
                }
                
                // Autres erreurs HTTP
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
                
            } catch (error) {
                console.error("Erreur lors de la requête API:", error);
                retries++;
                
                if (retries >= maxRetries) {
                    throw error;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
        }
    }
    
    /**
     * Récupère les vols arrivant à un aéroport
     * @param {string} airport - Code ICAO de l'aéroport
     * @param {number} begin - Timestamp de début
     * @param {number} end - Timestamp de fin
     * @returns {Promise<Array>} Liste des vols arrivant
     */
    async getAirportArrivals(airport, begin, end) {
        try {
            const data = await this.callApi('/flights/arrival', {
                airport,
                begin,
                end
            });
            
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Erreur lors de la récupération des arrivées:", error);
            return [];
        }
    }
    
    /**
     * Récupère les vols partant d'un aéroport
     * @param {string} airport - Code ICAO de l'aéroport
     * @param {number} begin - Timestamp de début
     * @param {number} end - Timestamp de fin
     * @returns {Promise<Array>} Liste des vols partant
     */
    async getAirportDepartures(airport, begin, end) {
        try {
            const data = await this.callApi('/flights/departure', {
                airport,
                begin,
                end
            });
            
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Erreur lors de la récupération des départs:", error);
            return [];
        }
    }
    
    /**
     * Récupère les états des avions par code ICAO
     * @param {Array<string>} icao24Array - Liste de codes ICAO24
     * @returns {Promise<Object>} Données d'état des avions
     */
    async getStatesByIcao(icao24Array) {
        try {
            return await this.callApi('/states/all', {
                icao24: icao24Array.join(',')
            });
        } catch (error) {
            console.error("Erreur lors de la récupération des états des avions:", error);
            return { states: [] };
        }
    }
    
    /**
     * Formate un vecteur d'état en objet plus pratique
     * @param {Array} stateVector - Données brutes d'un avion
     * @returns {Object} Données formatées
     */
    formatStateVector(stateVector) {
        // Format: [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, ...]
        const [
            icao24, 
            callsign, 
            originCountry, 
            timePosition, 
            lastContact, 
            longitude, 
            latitude, 
            baroAltitude, 
            onGround, 
            velocity, 
            heading,
            verticalRate,
            sensors,
            geoAltitude,
            squawk,
            spi,
            positionSource
        ] = stateVector;
        
        return {
            icao24,
            callsign,
            originCountry,
            timePosition,
            lastContact,
            longitude,
            latitude,
            baroAltitude,
            onGround,
            velocity,
            heading,
            verticalRate,
            sensors,
            geoAltitude,
            squawk,
            spi,
            positionSource
        };
    }
}
