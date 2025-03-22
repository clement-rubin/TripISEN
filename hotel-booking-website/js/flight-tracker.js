// Importer le module OpenSky API
import OpenSkyAPI from './opensky-api.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de la carte
    const map = L.map('map-container').setView([48.8566, 2.3522], 5); // Centré sur Paris par défaut
    
    // Ajouter la couche de carte OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Variables pour stocker les données et les marqueurs
    let flightMarkers = [];
    let currentAirport = 'LFPG'; // Paris Charles de Gaulle par défaut
    
    // Éléments du DOM
    const searchInput = document.getElementById('airport-search');
    const searchBtn = document.getElementById('search-btn');
    const showArrivalsCheckbox = document.getElementById('show-arrivals');
    const showDeparturesCheckbox = document.getElementById('show-departures');
    const arrivalsTabBtn = document.querySelector('.tab-btn[data-tab="arrivals"]');
    const departuresTabBtn = document.querySelector('.tab-btn[data-tab="departures"]');
    const arrivalsListEl = document.getElementById('arrivals-list');
    const departuresListEl = document.getElementById('departures-list');
    
    // Créer une instance de l'API OpenSky
    const openSkyApi = new OpenSkyAPI(config.opensky.username, config.opensky.password);
    
    // Dictionnaire des aéroports communs
    const commonAirports = {
        'LFPG': 'Paris Charles de Gaulle',
        'LFPO': 'Paris Orly',
        'EHAM': 'Amsterdam Schiphol',
        'EGLL': 'London Heathrow',
        'EDDF': 'Frankfurt',
        'LEMD': 'Madrid Barajas',
        'LIRF': 'Rome Fiumicino',
        'KJFK': 'New York JFK',
        'KLAX': 'Los Angeles LAX',
        'ZBAA': 'Beijing Capital',
        'VHHH': 'Hong Kong',
        'RJTT': 'Tokyo Haneda'
    };
    
    // Configuration de l'autocomplétion des aéroports
    function setupAirportAutocomplete() {
        const datalist = document.createElement('datalist');
        datalist.id = 'airport-suggestions';
        
        for (const code in commonAirports) {
            const option = document.createElement('option');
            option.value = code;
            option.text = `${code} - ${commonAirports[code]}`;
            datalist.appendChild(option);
        }
        
        document.body.appendChild(datalist);
        searchInput.setAttribute('list', 'airport-suggestions');
    }
    
    // Gestionnaires d'événements pour les onglets
    arrivalsTabBtn.addEventListener('click', function() {
        activateTab('arrivals');
    });
    
    departuresTabBtn.addEventListener('click', function() {
        activateTab('departures');
    });
    
    // Fonction pour activer un onglet
    function activateTab(tabName) {
        const tabs = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }
    
    // Gestionnaire de recherche
    searchBtn.addEventListener('click', function() {
        const airportCode = searchInput.value.trim().toUpperCase();
        if (!/^[A-Z]{4}$/.test(airportCode)) {
            alert("Veuillez entrer un code ICAO d'aéroport valide (4 lettres majuscules)");
            return;
        }
        
        currentAirport = airportCode;
        fetchFlightData(airportCode);
    });
    
    // Événements pour les checkboxes de filtrage
    showArrivalsCheckbox.addEventListener('change', function() {
        fetchFlightData(currentAirport);
    });
    
    showDeparturesCheckbox.addEventListener('change', function() {
        fetchFlightData(currentAirport);
    });
    
    // Touche Entrée pour lancer la recherche
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchBtn.click();
        }
    });
    
    // Fonction pour récupérer les données de vol
    async function fetchFlightData(airportCode) {
        // Nettoyer les listes actuelles
        arrivalsListEl.innerHTML = '<tr class="loading-message"><td colspan="4">Chargement des données...</td></tr>';
        departuresListEl.innerHTML = '<tr class="loading-message"><td colspan="4">Chargement des données...</td></tr>';
        
        // Effacer les marqueurs existants
        clearFlightMarkers();
        
        try {
            const begin = Math.floor(Date.now()/1000) - 7200; // 2 heures
            const end = Math.floor(Date.now()/1000);
            
            // Récupérer arrivées et départs en parallèle
            const promises = [];
            
            if (showArrivalsCheckbox.checked) {
                promises.push(openSkyApi.getAirportArrivals(airportCode, begin, end));
            } else {
                promises.push(Promise.resolve([]));
            }
            
            if (showDeparturesCheckbox.checked) {
                promises.push(openSkyApi.getAirportDepartures(airportCode, begin, end));
            } else {
                promises.push(Promise.resolve([]));
            }
            
            const [arrivals, departures] = await Promise.all(promises);
            
            // Afficher les résultats
            displayArrivals(arrivals);
            displayDepartures(departures);
            
            // Récupérer les positions actuelles des vols
            await fetchLivePositions([...arrivals, ...departures]);
            
            // Centrer la carte sur l'aéroport
            centreMapOnAirport(airportCode);
            
        } catch (error) {
            console.error("Erreur lors de la récupération des données:", error);
            arrivalsListEl.innerHTML = `<tr><td colspan="4" class="error-message">Erreur lors de la récupération des données. Veuillez réessayer plus tard.</td></tr>`;
            departuresListEl.innerHTML = `<tr><td colspan="4" class="error-message">Erreur lors de la récupération des données. Veuillez réessayer plus tard.</td></tr>`;
        }
    }
    
    // Afficher les arrivées
    function displayArrivals(arrivals) {
        if (!arrivals || arrivals.length === 0) {
            arrivalsListEl.innerHTML = `<tr><td colspan="4" class="no-data-message">Aucune arrivée récente trouvée pour cet aéroport.</td></tr>`;
            return;
        }
        
        // Trier les vols par heure d'arrivée
        arrivals.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
        
        let html = '';
        arrivals.slice(0, 20).forEach(flight => {
            const arrivalTime = flight.lastSeen ? new Date(flight.lastSeen * 1000) : null;
            const formattedTime = arrivalTime ? arrivalTime.toLocaleTimeString() : 'N/A';
            
            html += `
            <tr data-icao="${flight.icao24}">
                <td><strong>${flight.callsign || 'N/A'}</strong></td>
                <td>${flight.estDepartureAirport || 'Inconnu'}</td>
                <td>${formattedTime}</td>
                <td><span class="flight-status ${getFlightStatusClass(flight)}">
                    ${getFlightStatus(flight)}
                </span></td>
            </tr>`;
        });
        
        arrivalsListEl.innerHTML = html;
    }
    
    // Afficher les départs
    function displayDepartures(departures) {
        if (!departures || departures.length === 0) {
            departuresListEl.innerHTML = `<tr><td colspan="4" class="no-data-message">Aucun départ récent trouvé pour cet aéroport.</td></tr>`;
            return;
        }
        
        // Trier les vols par heure de départ
        departures.sort((a, b) => (b.firstSeen || 0) - (a.firstSeen || 0));
        
        let html = '';
        departures.slice(0, 20).forEach(flight => {
            const departureTime = flight.firstSeen ? new Date(flight.firstSeen * 1000) : null;
            const formattedTime = departureTime ? departureTime.toLocaleTimeString() : 'N/A';
            
            html += `
            <tr data-icao="${flight.icao24}">
                <td><strong>${flight.callsign || 'N/A'}</strong></td>
                <td>${flight.estArrivalAirport || 'Inconnu'}</td>
                <td>${formattedTime}</td>
                <td><span class="flight-status ${getFlightStatusClass(flight)}">
                    ${getFlightStatus(flight)}
                </span></td>
            </tr>`;
        });
        
        departuresListEl.innerHTML = html;
    }
    
    // Récupérer les positions en direct des avions
    async function fetchLivePositions(flights) {
        const icao24Set = new Set(flights.map(f => f.icao24));
        const icao24Array = Array.from(icao24Set);
        
        if (icao24Array.length === 0) return;
        
        try {
            // Récupérer les positions actuelles des avions
            const data = await openSkyApi.getStatesByIcao(icao24Array);
            
            if (data && data.states) {
                data.states.forEach(state => {
                    const formatted = openSkyApi.formatStateVector(state);
                    
                    if (formatted.latitude && formatted.longitude) {
                        // Créer un marqueur avec une icône d'avion
                        const marker = L.marker([formatted.latitude, formatted.longitude], {
                            icon: L.divIcon({
                                html: '<i class="fas fa-plane" style="color: #1565c0; transform: rotate(45deg);"></i>',
                                className: 'flight-icon',
                                iconSize: [20, 20]
                            })
                        }).addTo(map);
                        
                        marker.bindPopup(`
                            <strong>Vol: ${formatted.callsign || 'N/A'}</strong><br>
                            ICAO: ${formatted.icao24}<br>
                            Pays: ${formatted.originCountry}<br>
                            Altitude: ${Math.round(formatted.geoAltitude || 0)} m
                        `);
                        
                        flightMarkers.push(marker);
                    }
                });
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des positions des vols:", error);
        }
    }
    
    // Déterminer le statut du vol
    function getFlightStatus(flight) {
        // Logique simplifiée pour la démonstration
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (flight.estArrivalAirport && flight.lastSeen && currentTime - flight.lastSeen < 900) {
            return 'Atterri';
        }
        
        if (flight.estDepartureAirport && flight.firstSeen && currentTime - flight.firstSeen < 900) {
            return 'Décollé';
        }
        
        return 'En vol';
    }
    
    // Classe CSS pour le statut du vol
    function getFlightStatusClass(flight) {
        const status = getFlightStatus(flight);
        
        switch (status) {
            case 'Atterri': return 'status-landed';
            case 'Décollé': return 'status-ontime';
            case 'En vol': return 'status-ontime';
            case 'Retardé': return 'status-delayed';
            case 'Annulé': return 'status-cancelled';
            default: return '';
        }
    }
    
    // Centrer la carte sur un aéroport
    function centreMapOnAirport(airportCode) {
        // Coordonnées des principaux aéroports
        const airportCoordinates = {
            'LFPG': [49.0097, 2.5479],   // Paris Charles de Gaulle
            'LFPO': [48.7262, 2.3686],   // Paris Orly
            'EHAM': [52.3086, 4.7639],   // Amsterdam Schiphol
            'EGLL': [51.4775, -0.4614],  // London Heathrow
            'EDDF': [50.0379, 8.5622],   // Frankfurt
            'LEMD': [40.4983, -3.5676],  // Madrid Barajas
            'LIRF': [41.8003, 12.2389],  // Rome Fiumicino
            'KJFK': [40.6413, -73.7781], // New York JFK
            'KLAX': [33.9416, -118.4085], // Los Angeles LAX
            'ZBAA': [40.0799, 116.6031], // Beijing Capital
            'VHHH': [22.3080, 113.9185], // Hong Kong
            'RJTT': [35.5494, 139.7798]  // Tokyo Haneda
        };
        
        if (airportCoordinates[airportCode]) {
            map.setView(airportCoordinates[airportCode], 9);
            
            // Ajouter un marqueur pour l'aéroport
            L.marker(airportCoordinates[airportCode], {
                icon: L.divIcon({
                    html: '<i class="fas fa-plane-arrival" style="color: #c62828;"></i>',
                    className: 'airport-icon',
                    iconSize: [24, 24]
                })
            }).addTo(map).bindPopup(`<strong>Aéroport: ${airportCode}</strong>`);
        } else {
            // Position par défaut si l'aéroport n'est pas dans notre liste
            map.setView([48.8566, 2.3522], 5);
        }
    }
    
    // Effacer tous les marqueurs de vol
    function clearFlightMarkers() {
        flightMarkers.forEach(marker => {
            map.removeLayer(marker);
        });
        flightMarkers = [];
    }
    
    // Initialisation
    setupAirportAutocomplete();
    fetchFlightData(currentAirport);
});