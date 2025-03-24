/**
 * Classe pour interagir avec l'API OpenSky Network
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
        this.proxyPath = this.getProxyPath();
    }
    
    /**
     * Détermine le chemin du proxy en fonction de l'URL actuelle
     * @returns {string} Chemin du proxy
     */
    getProxyPath() {
        return 'php/api-proxy.php';
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
     * Effectue un appel API avec gestion des erreurs
     * @param {string} endpoint - Point de terminaison API
     * @param {Object} params - Paramètres de requête
     * @returns {Promise<Object>} Données de réponse
     */
    async callApi(endpoint, params = {}) {
        // Construire les paramètres de requête
        const queryParams = new URLSearchParams({
            endpoint,
            ...params
        }).toString();
        
        const url = `${this.proxyPath}?${queryParams}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
            
        } catch (error) {
            console.error("Erreur lors de la requête API:", error);
            
            // En cas d'erreur, générer des données de test
            return this.generateTestData(endpoint, params);
        }
    }
    
    /**
     * Récupère les arrivées à un aéroport
     * @param {string} airport - Code ICAO de l'aéroport
     * @param {number} begin - Timestamp de début
     * @param {number} end - Timestamp de fin
     * @returns {Promise<Array>} Liste des arrivées
     */
    async getAirportArrivals(airport, begin, end) {
        return this.callApi('/flights/arrival', {
            airport,
            begin,
            end
        });
    }
    
    /**
     * Récupère les départs d'un aéroport
     * @param {string} airport - Code ICAO de l'aéroport
     * @param {number} begin - Timestamp de début
     * @param {number} end - Timestamp de fin
     * @returns {Promise<Array>} Liste des départs
     */
    async getAirportDepartures(airport, begin, end) {
        return this.callApi('/flights/departure', {
            airport,
            begin,
            end
        });
    }
    
    /**
     * Génère des données de test en cas d'erreur API
     * @param {string} endpoint - Point de terminaison API
     * @param {Object} params - Paramètres de requête
     * @returns {Array} Données de test
     */
    generateTestData(endpoint, params) {
        const now = Math.floor(Date.now() / 1000);
        
        if (endpoint === '/flights/arrival') {
            return [
                {
                    icao24: "a1b2c3",
                    firstSeen: now - 7200,
                    lastSeen: now - 3600,
                    estDepartureAirport: "EGLL",
                    estArrivalAirport: params.airport,
                    callsign: "AFR1234",
                },
                {
                    icao24: "d4e5f6",
                    firstSeen: now - 10800,
                    lastSeen: now - 7200,
                    estDepartureAirport: "EDDF",
                    estArrivalAirport: params.airport,
                    callsign: "LFT5678",
                },
                {
                    icao24: "g7h8i9",
                    firstSeen: now - 14400,
                    lastSeen: now - 10800,
                    estDepartureAirport: "LIRF",
                    estArrivalAirport: params.airport,
                    callsign: "EJU9012",
                },
                {
                    icao24: "j0k1l2",
                    firstSeen: now - 18000,
                    lastSeen: now - 14400,
                    estDepartureAirport: "LEMD",
                    estArrivalAirport: params.airport,
                    callsign: "IBE3456",
                },
                {
                    icao24: "m3n4o5",
                    firstSeen: now - 21600,
                    lastSeen: now - 18000,
                    estDepartureAirport: "EHAM",
                    estArrivalAirport: params.airport,
                    callsign: "KLM7890",
                }
            ];
        } else if (endpoint === '/flights/departure') {
            return [
                {
                    icao24: "p6q7r8",
                    firstSeen: now - 3600,
                    lastSeen: now,
                    estDepartureAirport: params.airport,
                    estArrivalAirport: "EGLL",
                    callsign: "AFR2345",
                },
                {
                    icao24: "s9t0u1",
                    firstSeen: now - 7200,
                    lastSeen: now - 3600,
                    estDepartureAirport: params.airport,
                    estArrivalAirport: "EDDF",
                    callsign: "LFT6789",
                },
                {
                    icao24: "v2w3x4",
                    firstSeen: now - 10800,
                    lastSeen: now - 7200,
                    estDepartureAirport: params.airport,
                    estArrivalAirport: "LIRF",
                    callsign: "EJU0123",
                },
                {
                    icao24: "y5z6a7",
                    firstSeen: now - 14400,
                    lastSeen: now - 10800,
                    estDepartureAirport: params.airport,
                    estArrivalAirport: "LEMD",
                    callsign: "IBE4567",
                },
                {
                    icao24: "b8c9d0",
                    firstSeen: now - 18000,
                    lastSeen: now - 14400,
                    estDepartureAirport: params.airport,
                    estArrivalAirport: "EHAM",
                    callsign: "KLM8901",
                }
            ];
        }
        
        return [];
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
