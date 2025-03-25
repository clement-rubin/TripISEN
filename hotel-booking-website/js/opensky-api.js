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
        this.cache = {};
        this.cacheTTL = 300000; // 5 minutes in milliseconds
        
        // Table de correspondance IATA à ICAO
        this.iataToIcao = {
            'CDG': 'LFPG', // Paris Charles de Gaulle
            'ORY': 'LFPO', // Paris Orly
            'JFK': 'KJFK', // New York JFK
            'LHR': 'EGLL', // Londres Heathrow
            'LAX': 'KLAX', // Los Angeles
            'FCO': 'LIRF', // Rome Fiumicino
            'FRA': 'EDDF', // Francfort
            'AMS': 'EHAM', // Amsterdam
            'MAD': 'LEMD', // Madrid
            'BCN': 'LEBL', // Barcelone
            'DXB': 'OMDB', // Dubai
            'PEK': 'ZBAA'  // Pékin
        };
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
        const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
        const currentTime = Date.now();
        
        // Vérifie si nous avons une réponse en cache valide
        if (this.cache[cacheKey] && (currentTime - this.cache[cacheKey].timestamp < this.cacheTTL)) {
            console.log(`Récupération des données en cache pour ${endpoint} avec params:`, params);
            return this.cache[cacheKey].data;
        }
        
        // Construire les paramètres de requête
        const queryParams = new URLSearchParams();
        queryParams.append('endpoint', endpoint);
        
        // Ajouter tous les paramètres individuellement pour s'assurer qu'ils sont correctement transmis
        for (const [key, value] of Object.entries(params)) {
            queryParams.append(key, value);
        }
        
        const url = `${this.proxyPath}?${queryParams.toString()}`;
        console.log(`Appel API: ${url}`);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.status === 429) {
                console.warn("Rate limit exceeded, using simulated data");
                return this.generateTestData(endpoint, params);
            }
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Réponse API pour ${endpoint} avec ${params.airport || 'params'}:`, 
                        Array.isArray(data) ? `${data.length} éléments` : 'objet');
            
            // Cache the response
            this.cache[cacheKey] = {
                timestamp: currentTime,
                data: data
            };
            
            return data;
            
        } catch (error) {
            console.error("API error:", error);
            return this.generateTestData(endpoint, params);
        }
    }
    
    /**
     * Récupère les arrivées à un aéroport avec contournement des limitations d'API
     * @param {string} airport - Code ICAO de l'aéroport
     * @param {number} begin - Timestamp de début
     * @param {number} end - Timestamp de fin
     * @returns {Promise<Array>} Liste des arrivées
     */
    async getAirportArrivals(airport, begin, end) {
        // Ajout d'un timestamp aléatoire pour éviter le cache du navigateur/proxy
        const randomSeed = Math.floor(Math.random() * 1000);
        
        try {
            const data = await this.callApi('/flights/arrival', {
                airport,
                begin,
                end,
                _r: randomSeed // paramètre aléatoire pour éviter le cache
            });
            
            if (Array.isArray(data) && data.length > 0) {
                return data;
            } else {
                console.log(`Aucune arrivée trouvée pour ${airport}, utilisation des données simulées`);
                return this.getSimulatedArrivals(airport);
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération des arrivées pour ${airport}:`, error);
            return this.getSimulatedArrivals(airport);
        }
    }
    
    /**
     * Récupère les départs d'un aéroport avec contournement des limitations d'API
     * @param {string} airport - Code ICAO de l'aéroport
     * @param {number} begin - Timestamp de début
     * @param {number} end - Timestamp de fin
     * @returns {Promise<Array>} Liste des départs
     */
    async getAirportDepartures(airport, begin, end) {
        // Ajout d'un timestamp aléatoire pour éviter le cache du navigateur/proxy
        const randomSeed = Math.floor(Math.random() * 1000);
        
        try {
            const data = await this.callApi('/flights/departure', {
                airport,
                begin,
                end,
                _r: randomSeed // paramètre aléatoire pour éviter le cache
            });
            
            if (Array.isArray(data) && data.length > 0) {
                return data;
            } else {
                console.log(`Aucun départ trouvé pour ${airport}, utilisation des données simulées`);
                return this.getSimulatedDepartures(airport);
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération des départs pour ${airport}:`, error);
            return this.getSimulatedDepartures(airport);
        }
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

    /**
     * Récupère les données complètes pour un aéroport (arrivées et départs)
     * @param {string} airportCode - Code IATA (3 lettres) ou ICAO (4 lettres) de l'aéroport
     * @returns {Promise<Object>} Données d'arrivées et de départs
     */
    async getAirportData(airportCode) {
        try {
            // Normaliser le code ICAO (4 lettres) ou IATA (3 lettres)
            const icaoCode = this.normalizeAirportCode(airportCode);
            
            if (!icaoCode) {
                console.error("Code d'aéroport invalide:", airportCode);
                return { arrivals: [], departures: [] };
            }
            
            console.log(`Recherche des vols pour l'aéroport: ${icaoCode} (original: ${airportCode})`);
            
            // Calculer les timestamps (1 heure de données)
            const end = Math.floor(Date.now() / 1000);
            const begin = end - 3600; // 1 heure en arrière
            
            // Générer une clé de cache unique pour cet aéroport et cette période
            const cacheKey = `airport-data-${icaoCode}-${begin}`;
            
            // Vérifier si les données sont en cache et encore valides
            if (this.cache[cacheKey] && (Date.now() - this.cache[cacheKey].timestamp < this.cacheTTL)) {
                console.log(`Utilisation des données en cache pour ${icaoCode}`);
                return this.cache[cacheKey].data;
            }
            
            console.log(`Récupération des données fraîches pour ${icaoCode}`);
            
            // Récupérer les arrivées et départs en parallèle avec un petit délai entre les deux
            // pour éviter d'atteindre la limite de taux de l'API
            const arrivals = await this.getAirportArrivals(icaoCode, begin, end);
            // Petit délai pour éviter les limites de taux de l'API
            await new Promise(resolve => setTimeout(resolve, 500));
            const departures = await this.getAirportDepartures(icaoCode, begin, end);
            
            console.log(`Données récupérées pour ${icaoCode}: ${arrivals.length} arrivées, ${departures.length} départs`);
            
            // Traiter les données pour un format cohérent
            const processedArrivals = this.processFlightData(arrivals);
            const processedDepartures = this.processFlightData(departures);
            
            // Toujours inclure des données simulées si les résultats de l'API sont insuffisants
            const result = { 
                arrivals: processedArrivals.length > 0 ? processedArrivals : this.getSimulatedArrivals(icaoCode),
                departures: processedDepartures.length > 0 ? processedDepartures : this.getSimulatedDepartures(icaoCode)
            };
            
            // Mettre en cache le résultat
            this.cache[cacheKey] = {
                timestamp: Date.now(),
                data: result
            };
            
            return result;
        } catch (error) {
            console.error(`Erreur lors de la récupération des données pour ${airportCode}:`, error);
            return { 
                arrivals: this.getSimulatedArrivals(airportCode), 
                departures: this.getSimulatedDepartures(airportCode) 
            };
        }
    }
    
    /**
     * Normalise un code d'aéroport en code ICAO
     * @param {string} code - Code d'aéroport (IATA ou ICAO)
     * @returns {string} Code ICAO normalisé
     */
    normalizeAirportCode(code) {
        if (!code) return null;
        
        // Si c'est déjà un code ICAO à 4 lettres
        if (/^[A-Z]{4}$/.test(code.toUpperCase())) {
            return code.toUpperCase();
        }
        
        // Si c'est un code IATA à 3 lettres, convertir en ICAO
        if (/^[A-Z]{3}$/.test(code.toUpperCase())) {
            return this.iataToIcao[code.toUpperCase()] || `K${code.toUpperCase()}`;
        }
        
        return null;
    }
    
    /**
     * Traite les données brutes de vol en format plus utilisable
     * @param {Array} data - Données brutes de l'API
     * @returns {Array} Données formatées
     */
    processFlightData(data) {
        if (!Array.isArray(data)) return [];
        
        return data.map(flight => ({
            id: flight.icao24 || flight.callsign || Math.random().toString(36).substr(2, 9),
            callsign: flight.callsign || "N/A",
            departureAirport: flight.estDepartureAirport || "UNKNOWN",
            arrivalAirport: flight.estArrivalAirport || "UNKNOWN",
            departureTime: flight.firstSeen ? new Date(flight.firstSeen * 1000).toLocaleString() : "N/A",
            arrivalTime: flight.lastSeen ? new Date(flight.lastSeen * 1000).toLocaleString() : "N/A",
            airline: this.extractAirlineFromCallsign(flight.callsign || "")
        }));
    }
    
    /**
     * Extrait la compagnie aérienne à partir de l'indicatif d'appel
     * @param {string} callsign - Indicatif d'appel
     * @returns {string} Nom de la compagnie aérienne
     */
    extractAirlineFromCallsign(callsign) {
        if (!callsign || callsign === "N/A") return "Unknown";
        
        const airlineCode = callsign.substring(0, 3);
        
        const airlines = {
            'AFR': 'Air France',
            'BAW': 'British Airways',
            'DLH': 'Lufthansa',
            'UAL': 'United Airlines',
            'AAL': 'American Airlines',
            'DAL': 'Delta Air Lines',
            'EZY': 'EasyJet',
            'RYR': 'Ryanair',
            'EJU': 'EasyJet',
            'VLG': 'Vueling',
            'IBE': 'Iberia',
            'KLM': 'KLM Royal Dutch',
            'UAE': 'Emirates',
            'ETH': 'Ethiopian',
            'QTR': 'Qatar Airways',
            'SWR': 'Swiss'
        };
        
        return airlines[airlineCode] || airlineCode;
    }
    
    /**
     * Génère des arrivées simulées pour un aéroport
     * @param {string} icaoCode - Code ICAO de l'aéroport
     * @returns {Array} Vols d'arrivée simulés
     */
    getSimulatedArrivals(icaoCode) {
        const destinations = this.getDestinationsForAirport(icaoCode);
        const airlines = ['Air France', 'Lufthansa', 'British Airways', 'Delta', 'KLM', 'Emirates', 'EasyJet', 'Ryanair'];
        
        return Array.from({ length: 5 + Math.floor(Math.random() * 10) }, (_, i) => {
            const origin = destinations[Math.floor(Math.random() * destinations.length)];
            const airline = airlines[Math.floor(Math.random() * airlines.length)];
            const flightNumber = Math.floor(Math.random() * 9000) + 1000;
            const now = new Date();
            const arrivalTime = new Date(now.getTime() - (Math.random() * 60 * 60 * 1000));
            
            return {
                id: `SIM-ARR-${i}-${icaoCode}`,
                callsign: `${airline.substring(0, 3).toUpperCase()}${flightNumber}`,
                departureAirport: origin,
                arrivalAirport: icaoCode,
                departureTime: new Date(arrivalTime.getTime() - (Math.random() * 120 + 60) * 60 * 1000).toLocaleString(),
                arrivalTime: arrivalTime.toLocaleString(),
                airline: airline
            };
        });
    }
    
    /**
     * Génère des départs simulés pour un aéroport
     * @param {string} icaoCode - Code ICAO de l'aéroport
     * @returns {Array} Vols de départ simulés
     */
    getSimulatedDepartures(icaoCode) {
        const destinations = this.getDestinationsForAirport(icaoCode);
        const airlines = ['Air France', 'Lufthansa', 'British Airways', 'Delta', 'KLM', 'Emirates', 'EasyJet', 'Ryanair'];
        
        return Array.from({ length: 5 + Math.floor(Math.random() * 10) }, (_, i) => {
            const destination = destinations[Math.floor(Math.random() * destinations.length)];
            const airline = airlines[Math.floor(Math.random() * airlines.length)];
            const flightNumber = Math.floor(Math.random() * 9000) + 1000;
            const now = new Date();
            const departureTime = new Date(now.getTime() - (Math.random() * 60 * 60 * 1000));
            
            return {
                id: `SIM-DEP-${i}-${icaoCode}`,
                callsign: `${airline.substring(0, 3).toUpperCase()}${flightNumber}`,
                departureAirport: icaoCode,
                arrivalAirport: destination,
                departureTime: departureTime.toLocaleString(),
                arrivalTime: new Date(departureTime.getTime() + (Math.random() * 120 + 60) * 60 * 1000).toLocaleString(),
                airline: airline
            };
        });
    }
    
    /**
     * Retourne des destinations plausibles pour un aéroport
     * @param {string} icaoCode - Code ICAO de l'aéroport
     * @returns {Array} Liste de codes ICAO d'aéroports
     */
    getDestinationsForAirport(icaoCode) {
        const destinationMap = {
            'LFPG': ['KJFK', 'EGLL', 'LEMD', 'EDDF', 'LIRF'], // Paris CDG
            'LFPO': ['LEBL', 'LIML', 'LSZH', 'LEPA', 'LEMG'], // Paris Orly
            'KJFK': ['LFPG', 'EGLL', 'EDDF', 'LEMD', 'ZBAA'], // New York JFK
            'EGLL': ['LFPG', 'KJFK', 'OMDB', 'EDDF', 'VIDP'], // Londres Heathrow
            'LEMD': ['LFPG', 'EGLL', 'SBGR', 'SAEZ', 'LIRF'], // Madrid
            'EDDF': ['LFPG', 'KJFK', 'OMDB', 'VHHH', 'ZBAA'], // Francfort
            'EHAM': ['LFPG', 'LEMD', 'LTBA', 'LIRF', 'EGKK'], // Amsterdam
            'LIRF': ['LFPG', 'LGAV', 'LTBA', 'LEMD', 'EDDF'], // Rome
            'LEBL': ['EGKK', 'LFPO', 'EHAM', 'EDDF', 'LIMC'], // Barcelone
            // Par défaut
            'default': ['LFPG', 'KJFK', 'EGLL', 'EDDF', 'OMDB', 'VHHH', 'ZBAA']
        };
        
        return destinationMap[icaoCode] || destinationMap['default'];
    }

    /**
     * Méthode améliorée pour récupérer les données de vols pour l'interface utilisateur
     * @param {string} airportCode - Code d'aéroport
     * @returns {Promise<Object>} Données de vol traitées
     */
    async fetchFlightData(airportCode) {
        // Ajouter un petit délai pour éviter de frapper immédiatement l'API à nouveau
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Calculer la période (dernière heure)
        const end = Math.floor(Date.now() / 1000);
        const begin = end - 3600;
        
        // Récupérer les données d'arrivées et de départs
        return await this.getAirportData(airportCode);
    }
}
