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
    const customTimeToggle = document.getElementById('custom-time-toggle');
    const customTimeControls = document.getElementById('custom-time-controls');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const presetButtons = document.querySelectorAll('.preset-btn');
    
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
    
    // Initialisation des dates avec des valeurs par défaut
    function initializeDateTimeInputs() {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));
        
        // Format ISO date-time pour les inputs
        endTimeInput.value = formatDateTimeForInput(now);
        startTimeInput.value = formatDateTimeForInput(twoHoursAgo);
    }

    // Formater la date pour l'input datetime-local
    function formatDateTimeForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Gestionnaire d'événements pour la case à cocher d'activation de la période personnalisée
    customTimeToggle.addEventListener('change', function() {
        if (this.checked) {
            customTimeControls.style.display = 'flex';
            initializeDateTimeInputs();
        } else {
            customTimeControls.style.display = 'none';
        }
    });

    // Gestionnaire pour les boutons de préréglage de période
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const hours = parseInt(this.dataset.hours);
            const now = new Date();
            const startTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
            
            startTimeInput.value = formatDateTimeForInput(startTime);
            endTimeInput.value = formatDateTimeForInput(now);
            
            // Mise en évidence du bouton actif
            presetButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Fonction pour récupérer les données de vol
    async function fetchFlightData(airportCode) {
        // Nettoyer les listes actuelles
        arrivalsListEl.innerHTML = '<tr class="loading-message"><td colspan="4">Chargement des données...</td></tr>';
        departuresListEl.innerHTML = '<tr class="loading-message"><td colspan="4">Chargement des données...</td></tr>';
        
        // Effacer les marqueurs existants
        clearFlightMarkers();
        
        try {
            // Déterminer la période en fonction du choix de l'utilisateur
            let begin, end;
            
            if (customTimeToggle.checked) {
                // Utiliser la période personnalisée
                begin = Math.floor(new Date(startTimeInput.value).getTime() / 1000);
                end = Math.floor(new Date(endTimeInput.value).getTime() / 1000);
                
                // Vérifier que la période est valide
                if (isNaN(begin) || isNaN(end) || begin >= end) {
                    alert("Veuillez sélectionner une période valide (date de début avant date de fin)");
                    return;
                }
                
                // Limiter la période à 7 jours maximum (limitation de l'API OpenSky)
                const maxPeriod = 7 * 24 * 3600; // 7 jours en secondes
                if (end - begin > maxPeriod) {
                    alert("La période ne peut pas dépasser 7 jours. Veuillez réduire l'intervalle.");
                    return;
                }
            } else {
                // Période par défaut : dernières 2 heures
                end = Math.floor(Date.now() / 1000);
                begin = end - 7200; // 2 heures
            }
            
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
            
            // Ajout d'un message d'attente plus explicite pour les périodes plus longues
            if (end - begin > 86400) { // Plus d'un jour
                arrivalsListEl.innerHTML = '<tr class="loading-message"><td colspan="4">Chargement des données sur une période étendue, veuillez patienter...</td></tr>';
                departuresListEl.innerHTML = '<tr class="loading-message"><td colspan="4">Chargement des données sur une période étendue, veuillez patienter...</td></tr>';
            }
            
            const [arrivals, departures] = await Promise.all(promises);
            
            // Afficher les résultats
            displayArrivals(arrivals);
            displayDepartures(departures);
            
            // Récupérer les positions actuelles des vols (uniquement pour les vols récents)
            const currentTime = Math.floor(Date.now() / 1000);
            const recentFlights = [...arrivals, ...departures].filter(flight => {
                const lastSeenTime = flight.lastSeen || flight.firstSeen || 0;
                return currentTime - lastSeenTime < 3600; // Vols vus dans la dernière heure
            });
            
            await fetchLivePositions(recentFlights);
            
            // Centrer la carte sur l'aéroport
            centreMapOnAirport(airportCode);
            
        } catch (error) {
            console.error("Erreur lors de la récupération des données:", error);
            arrivalsListEl.innerHTML = `<tr><td colspan="4" class="error-message">Erreur lors de la récupération des données. Veuillez réessayer plus tard.</td></tr>`;
            departuresListEl.innerHTML = `<tr><td colspan="4" class="error-message">Erreur lors de la récupération des données. Veuillez réessayer plus tard.</td></tr>`;
        }
    }
    
    // Ajoutez ces variables globales
    let currentArrivalsPage = 1;
    let currentDeparturesPage = 1;
    const itemsPerPage = 20;
    let allArrivals = [];
    let allDepartures = [];

    // Remplacer le contenu de displayArrivals par:
    function displayArrivals(arrivals) {
        // Stocker toutes les arrivées
        allArrivals = arrivals || [];
        currentArrivalsPage = 1;
        
        displayArrivalsPage();
    }

    // Nouvelle fonction pour afficher une page spécifique
    function displayArrivalsPage() {
        if (allArrivals.length === 0) {
            arrivalsListEl.innerHTML = `<tr><td colspan="4" class="no-data-message">Aucune arrivée trouvée pour cet aéroport dans la période sélectionnée.</td></tr>`;
            document.getElementById('arrivals-pagination').innerHTML = '';
            return;
        }
        
        // Trier les vols par heure d'arrivée
        allArrivals.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
        
        // Calculer les indices pour la pagination
        const startIndex = (currentArrivalsPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allArrivals.length);
        const pageCount = Math.ceil(allArrivals.length / itemsPerPage);
        
        // Générer le HTML pour les vols de la page actuelle
        let html = '';
        for (let i = startIndex; i < endIndex; i++) {
            const flight = allArrivals[i];
            const arrivalTime = flight.lastSeen ? new Date(flight.lastSeen * 1000) : null;
            
            let formattedTime = 'N/A';
            if (arrivalTime) {
                if (customTimeToggle.checked) {
                    formattedTime = arrivalTime.toLocaleDateString() + ' ' + arrivalTime.toLocaleTimeString();
                } else {
                    formattedTime = arrivalTime.toLocaleTimeString();
                }
            }
            
            html += `
            <tr data-icao="${flight.icao24}">
                <td><strong>${flight.callsign || 'N/A'}</strong></td>
                <td>${flight.estDepartureAirport || 'Inconnu'}</td>
                <td>${formattedTime}</td>
                <td><span class="flight-status ${getFlightStatusClass(flight)}">
                    ${getFlightStatus(flight)}
                </span></td>
            </tr>`;
        }
        
        arrivalsListEl.innerHTML = html;
        
        // Générer la pagination
        updatePagination('arrivals-pagination', pageCount, currentArrivalsPage, (page) => {
            currentArrivalsPage = page;
            displayArrivalsPage();
        });
    }

    // Faire de même pour les départs
    function displayDepartures(departures) {
        allDepartures = departures || [];
        currentDeparturesPage = 1;
        
        displayDeparturesPage();
    }

    function displayDeparturesPage() {
        if (allDepartures.length === 0) {
            departuresListEl.innerHTML = `<tr><td colspan="4" class="no-data-message">Aucun départ trouvé pour cet aéroport dans la période sélectionnée.</td></tr>`;
            document.getElementById('departures-pagination').innerHTML = '';
            return;
        }
        
        // Trier les vols par heure de départ
        allDepartures.sort((a, b) => (b.firstSeen || 0) - (a.firstSeen || 0));
        
        // Calculer les indices pour la pagination
        const startIndex = (currentDeparturesPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allDepartures.length);
        const pageCount = Math.ceil(allDepartures.length / itemsPerPage);
        
        // Générer le HTML pour les vols de la page actuelle
        let html = '';
        for (let i = startIndex; i < endIndex; i++) {
            const flight = allDepartures[i];
            const departureTime = flight.firstSeen ? new Date(flight.firstSeen * 1000) : null;
            
            let formattedTime = 'N/A';
            if (departureTime) {
                if (customTimeToggle.checked) {
                    formattedTime = departureTime.toLocaleDateString() + ' ' + departureTime.toLocaleTimeString();
                } else {
                    formattedTime = departureTime.toLocaleTimeString();
                }
            }
            
            html += `
            <tr data-icao="${flight.icao24}">
                <td><strong>${flight.callsign || 'N/A'}</strong></td>
                <td>${flight.estArrivalAirport || 'Inconnu'}</td>
                <td>${formattedTime}</td>
                <td><span class="flight-status ${getFlightStatusClass(flight)}">
                    ${getFlightStatus(flight)}
                </span></td>
            </tr>`;
        }
        
        departuresListEl.innerHTML = html;
        
        // Générer la pagination
        updatePagination('departures-pagination', pageCount, currentDeparturesPage, (page) => {
            currentDeparturesPage = page;
            displayDeparturesPage();
        });
    }

    // Fonction pour générer la pagination
    function updatePagination(containerId, pageCount, currentPage, pageChangeCallback) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (pageCount <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="prev">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Limiter le nombre de boutons affichés
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(pageCount, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
        
        if (startPage > 1) {
            html += `
                <button class="pagination-btn" data-page="1">1</button>
                ${startPage > 2 ? '<span class="pagination-ellipsis">...</span>' : ''}
            `;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < pageCount) {
            html += `
                ${endPage < pageCount - 1 ? '<span class="pagination-ellipsis">...</span>' : ''}
                <button class="pagination-btn" data-page="${pageCount}">${pageCount}</button>
            `;
        }
        
        html += `
            <button class="pagination-btn" ${currentPage === pageCount ? 'disabled' : ''} data-page="next">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        container.innerHTML = html;
        
        // Ajouter les gestionnaires d'événements
        container.querySelectorAll('.pagination-btn').forEach(button => {
            button.addEventListener('click', function() {
                if (this.hasAttribute('disabled')) return;
                
                let newPage = this.dataset.page;
                if (newPage === 'prev') {
                    newPage = currentPage - 1;
                } else if (newPage === 'next') {
                    newPage = currentPage + 1;
                } else {
                    newPage = parseInt(newPage);
                }
                
                if (newPage >= 1 && newPage <= pageCount) {
                    pageChangeCallback(newPage);
                }
            });
        });
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
    
    // Ajoutez ces gestionnaires d'événements pour les inputs de date
    startTimeInput.addEventListener('change', function() {
        // Si l'utilisateur sélectionne une date de début après la date de fin
        if (new Date(startTimeInput.value) > new Date(endTimeInput.value)) {
            endTimeInput.value = startTimeInput.value; // Synchroniser la date de fin
        }
    });

    endTimeInput.addEventListener('change', function() {
        // Si l'utilisateur sélectionne une date de fin avant la date de début
        if (new Date(endTimeInput.value) < new Date(startTimeInput.value)) {
            startTimeInput.value = endTimeInput.value; // Synchroniser la date de début
        }
    });

    // Pour la boîte d'information
    document.querySelector('.api-info-title').addEventListener('click', function() {
        const content = document.querySelector('.api-info-content');
        const toggle = document.querySelector('.info-toggle');
        
        content.classList.toggle('active');
        toggle.classList.toggle('active');
    });

    // Initialisation
    setupAirportAutocomplete();
    fetchFlightData(currentAirport);
});