/**
 * Module de gestion des vols pour les pages de détail hôtel
 */
class HotelFlights {
    /**
     * Initialise le module de suivi des vols
     */
    constructor() {
        this.currentAirport = null;
        this.arrivalsData = [];
        this.departuresData = [];
        this.api = new OpenSkyAPI();
        this.loadingTimeout = null;
        
        this.initialize();
    }
    
    /**
     * Initialise les éléments DOM et les événements
     */
    initialize() {
        // Obtenir les éléments DOM
        this.flightsPreview = document.getElementById('flights-preview');
        this.flightsLoading = document.querySelector('.flights-loading');
        this.flightsContent = document.querySelector('.flights-content');
        this.flightsEmpty = document.querySelector('.flights-empty');
        
        if (!this.flightsPreview || !this.flightsLoading || !this.flightsContent || !this.flightsEmpty) {
            console.error("Éléments DOM manquants pour l'affichage des vols");
            return;
        }
        
        this.arrivalsTable = document.getElementById('arrivals-table')?.querySelector('tbody');
        this.departuresTable = document.getElementById('departures-table')?.querySelector('tbody');
        this.viewAllFlightsLink = document.getElementById('view-all-flights-link');
        
        // Initialiser les boutons de vue des vols
        const viewButtons = document.querySelectorAll('.view-flights-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const airportCode = button.dataset.airport;
                if (!airportCode) return;
                
                console.log(`Bouton cliqué pour l'aéroport: ${airportCode}`);
                
                // Réinitialiser les données pour le nouvel aéroport
                this.arrivalsData = [];
                this.departuresData = [];
                
                // Mettre en surbrillance le bouton sélectionné
                document.querySelectorAll('.airport-item').forEach(item => {
                    item.classList.remove('selected');
                });
                button.closest('.airport-item')?.classList.add('selected');
                
                // Récupérer et afficher les données
                this.fetchFlightData(airportCode);
                
                // Scroll doux vers l'aperçu des vols
                this.flightsPreview.scrollIntoView({ behavior: 'smooth' });
            });
        });
        
        // Initialiser les onglets
        const tabs = document.querySelectorAll('.flights-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Retirer la classe active de tous les onglets
                tabs.forEach(t => t.classList.remove('active'));
                // Ajouter la classe active à l'onglet cliqué
                tab.classList.add('active');
                
                // Afficher le tableau correspondant
                const tabName = tab.dataset.tab;
                if (tabName === 'arrivals') {
                    document.getElementById('arrivals-table').style.display = 'table';
                    document.getElementById('departures-table').style.display = 'none';
                } else {
                    document.getElementById('arrivals-table').style.display = 'none';
                    document.getElementById('departures-table').style.display = 'table';
                }
            });
        });
        
        // Précharger les données pour Paris (LFPG) si on est sur la page de l'hôtel Paris
        const isParisHotel = document.title.includes('Luxe Paris') || 
                            window.location.href.includes('hotel-detail.html');
        
        if (isParisHotel) {
            // Précharger les données de Charles de Gaulle (LFPG)
            setTimeout(() => {
                const parisButton = document.querySelector('[data-airport="LFPG"]');
                if (parisButton) {
                    parisButton.closest('.airport-item')?.classList.add('selected');
                }
                this.fetchFlightData('LFPG');
            }, 500);
        }
    }
    
    /**
     * Récupère et affiche les données de vol pour un aéroport
     * @param {string} airportCode - Code ICAO de l'aéroport
     */
    async fetchFlightData(airportCode) {
        if (!airportCode) return;
        
        // Même si c'est le même aéroport, on force la mise à jour
        // pour éviter les problèmes de données stagnantes
        this.currentAirport = airportCode;
        
        console.log(`Récupération des données pour l'aéroport: ${airportCode}`);
        this.showLoading();
        
        // Définir un délai maximum pour le chargement (5 secondes)
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = setTimeout(() => {
            console.warn("Délai de chargement dépassé, utilisation des données simulées");
            this.useSimulatedData(airportCode);
        }, 5000);
        
        try {
            // Calculer période (hier)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            const begin = Math.floor(yesterday.getTime() / 1000);
            const end = begin + 86400; // 24 heures
            
            console.log(`Période: ${new Date(begin*1000).toLocaleString()} à ${new Date(end*1000).toLocaleString()}`);
            
            // Récupérer arrivées et départs avec une limite de temps
            const [arrivals, departures] = await Promise.all([
                this.api.getAirportArrivals(airportCode, begin, end),
                this.api.getAirportDepartures(airportCode, begin, end)
            ]);
            
            console.log(`Données récupérées: ${arrivals.length} arrivées, ${departures.length} départs`);
            
            // Annuler le délai de secours
            clearTimeout(this.loadingTimeout);
            
            // Utiliser les données récupérées ou simulées si vides
            if (arrivals.length === 0 && departures.length === 0) {
                this.useSimulatedData(airportCode);
                return;
            }
            
            // Stocker les données
            this.arrivalsData = arrivals;
            this.departuresData = departures;
            
            // Mettre à jour l'interface
            this.updateFlightDisplay(airportCode, arrivals.length, departures.length);
            
        } catch (error) {
            console.error('Erreur lors de la récupération des données de vol:', error);
            clearTimeout(this.loadingTimeout);
            this.useSimulatedData(airportCode);
        }
    }
    
    /**
     * Utilise des données simulées en cas d'échec de l'API
     * @param {string} airportCode - Code ICAO de l'aéroport
     */
    useSimulatedData(airportCode) {
        console.log("Utilisation de données simulées pour", airportCode);
        
        const now = Math.floor(Date.now() / 1000);
        const yesterday = now - 86400;
        
        // Générer des données simulées
        const simulatedArrivals = this.generateSimulatedFlights(airportCode, 8, true, yesterday);
        const simulatedDepartures = this.generateSimulatedFlights(airportCode, 10, false, yesterday);
        
        // Stocker les données
        this.arrivalsData = simulatedArrivals;
        this.departuresData = simulatedDepartures;
        
        // Mettre à jour l'interface
        this.updateFlightDisplay(airportCode, simulatedArrivals.length, simulatedDepartures.length);
    }
    
    /**
     * Met à jour l'affichage des données de vol
     * @param {string} airportCode - Code ICAO de l'aéroport
     * @param {number} arrivalsCount - Nombre d'arrivées
     * @param {number} departuresCount - Nombre de départs
     */
    updateFlightDisplay(airportCode, arrivalsCount, departuresCount) {
        console.log(`Mise à jour de l'affichage pour: ${airportCode} - Arrivées: ${arrivalsCount}, Départs: ${departuresCount}`);
        
        // Mettre à jour les tableaux
        this.updateArrivalsTable();
        this.updateDeparturesTable();
        
        // Mettre à jour le lien "Voir tous les vols"
        if (this.viewAllFlightsLink) {
            this.viewAllFlightsLink.href = `flight-tracker.html?airport=${airportCode}`;
        }
        
        // Afficher le nom de l'aéroport actif
        const airportName = this.getAirportName(airportCode);
        const airportTitle = document.createElement('div');
        airportTitle.className = 'airport-title';
        airportTitle.innerHTML = `
            <i class="fas fa-plane-departure"></i>
            <h4>${airportName}</h4>
            <div class="flight-stats-badge">
                <span>${arrivalsCount + departuresCount} vols</span>
            </div>
        `;
        
        // Remplacer tout titre existant
        const existingTitle = this.flightsContent.querySelector('.airport-title');
        if (existingTitle) {
            existingTitle.replaceWith(airportTitle);
        } else {
            this.flightsContent.insertBefore(airportTitle, this.flightsContent.firstChild);
        }
        
        // Afficher le contenu
        this.showContent();
    }
    
    /**
     * Génère des données de vol simulées
     */
    generateSimulatedFlights(airportCode, count, isArrival, baseTime) {
        const flights = [];
        const airlines = ['AFR', 'BAW', 'DLH', 'EZY', 'RYR', 'KLM', 'IBE', 'SWR', 'BEL', 'AUA'];
        const airports = ['LFPG', 'EGLL', 'EDDF', 'LEMD', 'EHAM', 'LIRF', 'LSZH', 'EKCH', 'LEBL', 'LFPO']
            .filter(code => code !== airportCode);
        
        for (let i = 0; i < count; i++) {
            const airline = airlines[Math.floor(Math.random() * airlines.length)];
            const flightNum = 1000 + Math.floor(Math.random() * 9000);
            const callsign = `${airline}${flightNum}`;
            
            const otherAirport = airports[Math.floor(Math.random() * airports.length)];
            const timeOffset = Math.floor(Math.random() * 86400); // Réparti sur 24h
            
            if (isArrival) {
                flights.push({
                    icao24: `a${i}${Math.random().toString(36).substr(2, 6)}`,
                    firstSeen: baseTime + timeOffset - 7200, // 2h avant arrivée
                    lastSeen: baseTime + timeOffset,
                    estDepartureAirport: otherAirport,
                    estArrivalAirport: airportCode,
                    callsign: callsign
                });
            } else {
                flights.push({
                    icao24: `d${i}${Math.random().toString(36).substr(2, 6)}`,
                    firstSeen: baseTime + timeOffset,
                    lastSeen: baseTime + timeOffset + 7200, // 2h après départ
                    estDepartureAirport: airportCode,
                    estArrivalAirport: otherAirport,
                    callsign: callsign
                });
            }
        }
        
        return flights;
    }
    
    /**
     * Affiche l'indicateur de chargement
     */
    showLoading() {
        if (this.flightsEmpty) this.flightsEmpty.style.display = 'none';
        if (this.flightsContent) this.flightsContent.style.display = 'none';
        if (this.flightsLoading) this.flightsLoading.style.display = 'flex';
    }
    
    /**
     * Affiche le contenu des vols
     */
    showContent() {
        if (this.flightsEmpty) this.flightsEmpty.style.display = 'none';
        if (this.flightsLoading) this.flightsLoading.style.display = 'none';
        if (this.flightsContent) this.flightsContent.style.display = 'block';
    }
    
    /**
     * Met à jour le tableau des arrivées
     */
    updateArrivalsTable() {
        if (!this.arrivalsTable) return;
        console.log(`Mise à jour du tableau des arrivées avec ${this.arrivalsData.length} vols`);
        
        // Limiter à 5 vols pour l'aperçu
        const arrivals = this.arrivalsData.slice(0, 5);
        
        if (arrivals.length === 0) {
            this.arrivalsTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">Aucune arrivée trouvée</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        arrivals.forEach(flight => {
            const arrivalTime = flight.lastSeen ? new Date(flight.lastSeen * 1000).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A';
            
            const status = this.getFlightStatus(flight);
            const statusClass = this.getStatusClass(status);
            
            html += `
                <tr>
                    <td><strong>${flight.callsign || 'N/A'}</strong></td>
                    <td>${flight.estDepartureAirport || 'Inconnu'}</td>
                    <td>${arrivalTime}</td>
                    <td><span class="flight-status ${statusClass}">${status}</span></td>
                </tr>
            `;
        });
        
        this.arrivalsTable.innerHTML = html;
    }
    
    /**
     * Met à jour le tableau des départs
     */
    updateDeparturesTable() {
        if (!this.departuresTable) return;
        console.log(`Mise à jour du tableau des départs avec ${this.departuresData.length} vols`);
        
        // Limiter à 5 vols pour l'aperçu
        const departures = this.departuresData.slice(0, 5);
        
        if (departures.length === 0) {
            this.departuresTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">Aucun départ trouvé</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        departures.forEach(flight => {
            const departureTime = flight.firstSeen ? new Date(flight.firstSeen * 1000).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A';
            
            const status = this.getFlightStatus(flight);
            const statusClass = this.getStatusClass(status);
            
            html += `
                <tr>
                    <td><strong>${flight.callsign || 'N/A'}</strong></td>
                    <td>${flight.estArrivalAirport || 'Inconnu'}</td>
                    <td>${departureTime}</td>
                    <td><span class="flight-status ${statusClass}">${status}</span></td>
                </tr>
            `;
        });
        
        this.departuresTable.innerHTML = html;
    }
    
    /**
     * Obtient le nom d'un aéroport à partir de son code
     * @param {string} code - Code ICAO de l'aéroport
     * @returns {string} Nom de l'aéroport
     */
    getAirportName(code) {
        const airports = {
            'LFPG': 'Paris Charles de Gaulle',
            'LFPO': 'Paris Orly',
            'LFMN': 'Nice Côte d\'Azur',
            'LFLP': 'Annecy Mont Blanc',
            'LFLL': 'Lyon Saint-Exupéry'
        };
        
        return airports[code] || code;
    }
    
    /**
     * Détermine le statut d'un vol
     * @param {Object} flight - Données du vol
     * @returns {string} Statut du vol
     */
    getFlightStatus(flight) {
        const now = Math.floor(Date.now() / 1000);
        const lastSeen = flight.lastSeen || 0;
        
        if (now - lastSeen < 3600) {
            return 'Atterri';
        } else if (flight.firstSeen && now < flight.firstSeen + 1800) {
            return 'Embarquement';
        } else if (Math.random() < 0.1) {
            return 'Retardé';
        } else {
            return 'À l\'heure';
        }
    }
    
    /**
     * Obtient la classe CSS pour un statut
     * @param {string} status - Statut du vol
     * @returns {string} Classe CSS
     */
    getStatusClass(status) {
        switch (status) {
            case 'À l\'heure':
                return 'status-ontime';
            case 'Retardé':
                return 'status-delayed';
            case 'Atterri':
                return 'status-landed';
            case 'Embarquement':
                return 'status-boarding';
            default:
                return '';
        }
    }
}

// Initialiser le module lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // S'assurer que la classe OpenSkyAPI est chargée
    if (typeof OpenSkyAPI === 'undefined') {
        window.OpenSkyAPI = class {
            constructor() {}
            async getAirportArrivals() { return []; }
            async getAirportDepartures() { return []; }
        };
    }
    
    // Initialiser le suivi des vols
    window.hotelFlights = new HotelFlights();
});

/**
 * Script minimaliste pour la section de suivi des vols
 */
document.addEventListener('DOMContentLoaded', () => {
    const airportCards = document.querySelectorAll('.airport-card');
    
    if (!airportCards.length) return;
    
    // Mettre à jour les compteurs de vol pour chaque aéroport
    airportCards.forEach(card => {
        const airportCode = card.dataset.code;
        if (!airportCode) return;
        
        const flightCountEl = card.querySelector('.flight-count');
        if (!flightCountEl) return;
        
        // Simuler un appel API avec une variation aléatoire pour démontration
        const min = 15;
        const max = 50;
        const flightCount = Math.floor(Math.random() * (max - min + 1)) + min;
        
        flightCountEl.innerHTML = `<i class="fas fa-plane-departure"></i> ${flightCount} vols aujourd'hui`;
    });
});

/**
 * Module de gestion des vols pour les pages détail hôtel
 */
document.addEventListener('DOMContentLoaded', function() {
    // Configuration des aéroports proches pour chaque hôtel
    const hotelAirports = {
        'paris': {
            main: 'LFPG',  // Charles de Gaulle
            alternatives: ['LFPO', 'LFOB'], // Orly, Beauvais
            name: 'Paris',
            mapCenter: [48.8566, 2.3522],
            mapZoom: 9
        },
        'mediterranee': {
            main: 'LFMN',  // Nice Côte d'Azur
            alternatives: ['LFMD', 'LFML'], // Cannes, Marseille
            name: 'Nice',
            mapCenter: [43.7102, 7.2620],
            mapZoom: 10
        },
        'alpin': {
            main: 'LFLP',  // Annecy Mont-Blanc
            alternatives: ['LFLL', 'LFLY'], // Lyon Saint-Exupéry, Lyon Bron
            name: 'Annecy/Chamonix',
            mapCenter: [45.9237, 6.8694],
            mapZoom: 9
        }
    };

    // Déterminer l'hôtel actuel à partir de l'URL
    let currentHotel = 'paris'; // Par défaut
    
    if (window.location.href.includes('hotel-detail-mediterranee')) {
        currentHotel = 'mediterranee';
    } else if (window.location.href.includes('hotel-detail-alpin')) {
        currentHotel = 'alpin';
    }

    // Récupérer la configuration de l'aéroport pour cet hôtel
    const airportConfig = hotelAirports[currentHotel];
    
    // Créer la section de vols si elle n'existe pas déjà
    initFlightsSection(airportConfig);

    /**
     * Initialise la section de suivi des vols
     */
    function initFlightsSection(config) {
        // Vérifier si la section existe déjà
        if (document.querySelector('.hotel-flights-container')) {
            return;
        }
        
        // Créer le conteneur pour les vols
        const flightsContainer = document.createElement('div');
        flightsContainer.className = 'hotel-flights-container';
        
        // HTML pour la section des vols
        flightsContainer.innerHTML = `
            <div class="section flights-section">
                <h2><i class="fas fa-plane"></i> Vols à proximité</h2>
                
                <div class="flights-info">
                    <p>Consultez les vols à destination et en provenance des aéroports proches de votre hôtel.</p>
                    <p>Aéroport principal : <strong>${config.main} (${getAirportName(config.main)})</strong></p>
                    <p>Autres aéroports à proximité : ${config.alternatives.map(code => `<span>${code} (${getAirportName(code)})</span>`).join(', ')}</p>
                </div>
                
                <div class="flight-options">
                    <label>Choisir un aéroport : 
                        <select id="airport-selector" class="form-control">
                            <option value="${config.main}">${config.main} - ${getAirportName(config.main)}</option>
                            ${config.alternatives.map(code => 
                                `<option value="${code}">${code} - ${getAirportName(code)}</option>`
                            ).join('')}
                        </select>
                    </label>
                    
                    <button id="view-flights-btn" class="btn btn-primary">
                        <i class="fas fa-plane-departure"></i> Voir les vols
                    </button>
                </div>
                
                <div id="flights-results" class="flights-results">
                    <p class="select-prompt">Sélectionnez un aéroport et cliquez sur "Voir les vols" pour afficher les derniers vols.</p>
                </div>
            </div>
        `;
        
        // Insérer après la section météo ou la description
        const targetSection = document.querySelector('.hotel-weather-container') || 
                            document.querySelector('.section.description');
        
        if (targetSection) {
            targetSection.parentNode.insertBefore(flightsContainer, targetSection.nextSibling);
        } else {
            // Fallback
            const hotelMain = document.querySelector('.hotel-main');
            if (hotelMain) {
                hotelMain.appendChild(flightsContainer);
            }
        }
        
        // Ajouter les événements
        document.getElementById('view-flights-btn').addEventListener('click', function() {
            const selectedAirport = document.getElementById('airport-selector').value;
            loadFlightsData(selectedAirport);
        });
    }
    
    /**
     * Charge les données de vols pour l'aéroport sélectionné
     */
    function loadFlightsData(airportCode) {
        const resultsContainer = document.getElementById('flights-results');
        if (!resultsContainer) return;
        
        // Afficher l'état de chargement
        resultsContainer.innerHTML = `
            <div class="flights-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Chargement des informations de vol...</p>
            </div>
        `;
        
        // Utiliser l'API OpenSky pour récupérer les vols
        // Période: dernières 2 heures
        const end = Math.floor(Date.now() / 1000);
        const start = end - 7200; // 2 heures en secondes
        
        // Récupérer arrivées et départs
        Promise.all([
            openSkyApi.getAirportArrivals(airportCode, start, end),
            openSkyApi.getAirportDepartures(airportCode, start, end)
        ])
        .then(([arrivals, departures]) => {
            displayFlightsData(resultsContainer, arrivals, departures, airportCode);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des vols:', error);
            resultsContainer.innerHTML = `
                <div class="flights-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Impossible de charger les données de vol. Veuillez réessayer plus tard.</p>
                    <button id="retry-flights" class="btn btn-secondary">Réessayer</button>
                </div>
            `;
            
            document.getElementById('retry-flights')?.addEventListener('click', function() {
                loadFlightsData(airportCode);
            });
        });
    }
    
    /**
     * Affiche les données de vol récupérées
     */
    function displayFlightsData(container, arrivals, departures, airportCode) {
        // Si aucun vol n'est disponible
        if (arrivals.length === 0 && departures.length === 0) {
            container.innerHTML = `
                <div class="flights-no-data">
                    <i class="fas fa-info-circle"></i>
                    <p>Aucun vol récent trouvé pour l'aéroport ${airportCode}.</p>
                </div>
            `;
            return;
        }
        
        // Format pour les heures
        const formatTime = (timestamp) => {
            if (!timestamp) return 'N/A';
            return new Date(timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        };
        
        // Trier les vols par heure (les plus récents d'abord)
        arrivals.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
        departures.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
        
        // Limiter à 5 vols maximum pour chaque catégorie
        const recentArrivals = arrivals.slice(0, 5);
        const recentDepartures = departures.slice(0, 5);
        
        // Créer le HTML pour les tableaux de vols
        let html = `
            <div class="flights-tabs">
                <ul class="nav nav-tabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="arrivals-tab" data-bs-toggle="tab" data-bs-target="#arrivals-content" type="button" role="tab">
                            <i class="fas fa-plane-arrival"></i> Arrivées (${recentArrivals.length})
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="departures-tab" data-bs-toggle="tab" data-bs-target="#departures-content" type="button" role="tab">
                            <i class="fas fa-plane-departure"></i> Départs (${recentDepartures.length})
                        </button>
                    </li>
                </ul>
                
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="arrivals-content" role="tabpanel">
                        ${createFlightTable(recentArrivals, true)}
                    </div>
                    <div class="tab-pane fade" id="departures-content" role="tabpanel">
                        ${createFlightTable(recentDepartures, false)}
                    </div>
                </div>
            </div>
            
            <div class="flights-footer">
                <p>Ces informations sont fournies par OpenSky Network.</p>
                <a href="flight-tracker.html" class="btn btn-outline-primary btn-sm">
                    <i class="fas fa-external-link-alt"></i> Aller au suivi des vols complet
                </a>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Fonction pour créer un tableau de vols
        function createFlightTable(flights, isArrival) {
            if (flights.length === 0) {
                return `<p class="no-flights">Aucun ${isArrival ? 'vol d\'arrivée' : 'vol de départ'} récent.</p>`;
            }
            
            return `
                <table class="flights-table">
                    <thead>
                        <tr>
                            <th>Vol</th>
                            <th>De</th>
                            <th>Vers</th>
                            <th>Heure</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${flights.map(flight => `
                            <tr>
                                <td>
                                    <strong>${flight.callsign || 'N/A'}</strong>
                                    <div class="flight-aircraft">${flight.icao24.toUpperCase()}</div>
                                </td>
                                <td>${isArrival ? 
                                    getAirportName(flight.estDepartureAirport) || flight.estDepartureAirport || 'N/A' : 
                                    getAirportName(airportCode) || airportCode}
                                </td>
                                <td>${isArrival ? 
                                    getAirportName(airportCode) || airportCode : 
                                    getAirportName(flight.estArrivalAirport) || flight.estArrivalAirport || 'N/A'}
                                </td>
                                <td>${formatTime(isArrival ? flight.lastSeen : flight.firstSeen)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }
    
    /**
     * Retourne le nom d'un aéroport à partir de son code ICAO
     */
    function getAirportName(icao) {
        if (!icao) return '';
        
        const airports = {
            'LFPG': 'Paris Charles de Gaulle',
            'LFPO': 'Paris Orly',
            'LFOB': 'Beauvais-Tillé',
            'LFMN': 'Nice Côte d\'Azur',
            'LFMD': 'Cannes-Mandelieu',
            'LFML': 'Marseille Provence',
            'LFLP': 'Annecy Mont-Blanc',
            'LFLL': 'Lyon Saint-Exupéry',
            'LFLY': 'Lyon Bron',
            'LFST': 'Strasbourg',
            'LFBD': 'Bordeaux-Mérignac',
            'LFMH': 'Saint-Étienne-Loire',
            'LFLS': 'Grenoble-Alpes-Isère'
        };
        
        return airports[icao] || null;
    }
});