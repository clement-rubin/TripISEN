document.addEventListener('DOMContentLoaded', function() {
    // Initialiser l'authentification
    if (typeof initAuth === 'function') {
        initAuth();
    }
    
    // Galerie d'images
    const mainImage = document.getElementById('main-gallery-image');
    const thumbs = document.querySelectorAll('.thumb');
    const zoomIcon = document.getElementById('zoom-image');
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const currentImageNum = document.getElementById('current-image');
    const totalImages = document.getElementById('total-images');
    
    let currentIndex = 0;
    
    // Initialisation du compteur d'images
    if (totalImages) {
        totalImages.textContent = thumbs.length;
    }
    
    // Fonction pour précharger les images
    function preloadImages() {
        thumbs.forEach(thumb => {
            const img = new Image();
            img.src = thumb.getAttribute('data-src');
        });
    }
    
    // Précharger les images pour améliorer la qualité d'affichage
    preloadImages();
    
    // Fonction pour changer l'image principale
    function changeMainImage(index) {
        thumbs.forEach(thumb => thumb.classList.remove('active'));
        thumbs[index].classList.add('active');
        
        // Créer une nouvelle image et la remplacer seulement quand elle est chargée
        const newImg = new Image();
        newImg.onload = function() {
            mainImage.src = this.src;
        };
        newImg.src = thumbs[index].getAttribute('data-src');
        
        currentIndex = index;
        
        if (currentImageNum) {
            currentImageNum.textContent = index + 1;
        }
    }
    
    // Ajouter les écouteurs d'événements aux miniatures
    thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            changeMainImage(index);
        });
    });
    
    // Navigation avec les flèches
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = thumbs.length - 1;
            changeMainImage(newIndex);
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            let newIndex = currentIndex + 1;
            if (newIndex >= thumbs.length) newIndex = 0;
            changeMainImage(newIndex);
        });
    }
    
    // Zoom (ouverture de la lightbox)
    if (zoomIcon) {
        zoomIcon.addEventListener('click', () => {
            lightboxImg.src = mainImage.src;
            lightboxCaption.textContent = thumbs[currentIndex].getAttribute('data-caption') || '';
            lightbox.classList.add('active');
        });
    }
    
    // Fermeture de la lightbox
    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
    }
    
    // Navigation dans la lightbox
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = thumbs.length - 1;
            changeMainImage(newIndex);
            lightboxImg.src = thumbs[newIndex].getAttribute('data-src');
            lightboxCaption.textContent = thumbs[newIndex].getAttribute('data-caption') || '';
        });
    }
    
    if (lightboxNext) {
        lightboxNext.addEventListener('click', () => {
            let newIndex = currentIndex + 1;
            if (newIndex >= thumbs.length) newIndex = 0;
            changeMainImage(newIndex);
            lightboxImg.src = thumbs[newIndex].getAttribute('data-src');
            lightboxCaption.textContent = thumbs[newIndex].getAttribute('data-caption') || '';
        });
    }
    
    // Fermer la lightbox en cliquant en dehors de l'image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
    
    // Touches du clavier pour la navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') {
                lightbox.classList.remove('active');
            } else if (e.key === 'ArrowLeft') {
                lightboxPrev.click();
            } else if (e.key === 'ArrowRight') {
                lightboxNext.click();
            }
        }
    });
    
    // Formulaire de réservation
    const checkInInput = document.getElementById('check-in');
    const checkOutInput = document.getElementById('check-out');
    
    if (checkInInput && checkOutInput) {
        // Définir la date d'aujourd'hui comme minimum pour l'arrivée
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const formattedToday = today.toISOString().split('T')[0];
        const formattedTomorrow = tomorrow.toISOString().split('T')[0];
        
        checkInInput.min = formattedToday;
        checkInInput.value = formattedToday;
        
        checkOutInput.min = formattedTomorrow;
        checkOutInput.value = formattedTomorrow;
        
        // Mettre à jour la date minimale de départ en fonction de la date d'arrivée
        checkInInput.addEventListener('change', function() {
            const newMinDate = new Date(this.value);
            newMinDate.setDate(newMinDate.getDate() + 1);
            const formattedNewMin = newMinDate.toISOString().split('T')[0];
            
            checkOutInput.min = formattedNewMin;
            
            if (new Date(checkOutInput.value) <= new Date(this.value)) {
                checkOutInput.value = formattedNewMin;
            }
            
            updatePriceSummary();
        });
        
        checkOutInput.addEventListener('change', updatePriceSummary);
        
        // Mettre à jour le récapitulatif des prix
        function updatePriceSummary() {
            const checkIn = new Date(checkInInput.value);
            const checkOut = new Date(checkOutInput.value);
            const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            
            const priceElement = document.querySelector('.room-price .price, .current-price');
            let pricePerNight = 0;
            
            if (priceElement) {
                pricePerNight = parseInt(priceElement.textContent.replace('€', ''), 10);
            }
            
            const totalPrice = pricePerNight * nights;
            
            const priceSummary = document.querySelector('.price-summary');
            if (priceSummary) {
                const priceRow = priceSummary.querySelector('.price-row:not(.total)');
                const totalRow = priceSummary.querySelector('.price-row.total');
                
                if (priceRow && totalRow) {
                    priceRow.innerHTML = `<span>${pricePerNight}€ x ${nights} nuit${nights > 1 ? 's' : ''}</span><span>${totalPrice}€</span>`;
                    totalRow.innerHTML = `<span>Total</span><span>${totalPrice}€</span>`;
                }
            }
        }
        
        // Initial update
        updatePriceSummary();
    }
});

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
        this.arrivalsTable = document.getElementById('arrivals-table').querySelector('tbody');
        this.departuresTable = document.getElementById('departures-table').querySelector('tbody');
        this.viewAllFlightsLink = document.getElementById('view-all-flights-link');
        
        // Initialiser les boutons de vue des vols
        const viewButtons = document.querySelectorAll('.view-flights-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const airportCode = button.dataset.airport;
                this.fetchFlightData(airportCode);
                
                // Scroll doux vers l'aperçu des vols
                this.flightsPreview.scrollIntoView({ behavior: 'smooth' });
                
                // Mettre en surbrillance l'élément d'aéroport sélectionné
                document.querySelectorAll('.airport-item').forEach(item => {
                    item.classList.remove('selected');
                });
                button.closest('.airport-item').classList.add('selected');
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
            setTimeout(() => this.fetchFlightData('LFPG'), 500);
            
            // Marquer le bouton comme sélectionné
            const parisButton = document.querySelector('[data-airport="LFPG"]');
            if (parisButton) {
                parisButton.closest('.airport-item').classList.add('selected');
            }
        }
    }
    
    /**
     * Récupère et affiche les données de vol pour un aéroport
     * @param {string} airportCode - Code ICAO de l'aéroport
     */
    async fetchFlightData(airportCode) {
        if (this.currentAirport === airportCode) return;
        
        this.currentAirport = airportCode;
        this.showLoading();
        
        try {
            // Calculer période (hier)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            const begin = Math.floor(yesterday.getTime() / 1000);
            const end = begin + 86400; // 24 heures
            
            // Récupérer arrivées et départs
            const [arrivals, departures] = await Promise.all([
                this.api.getAirportArrivals(airportCode, begin, end),
                this.api.getAirportDepartures(airportCode, begin, end)
            ]);
            
            // Stocker les données
            this.arrivalsData = arrivals;
            this.departuresData = departures;
            
            // Ajouter les badges de comptage aux boutons
            this.updateAirportBadges(airportCode, arrivals.length, departures.length);
            
            // Mettre à jour les tableaux
            this.updateArrivalsTable();
            this.updateDeparturesTable();
            
            // Mettre à jour le lien "Voir tous les vols"
            this.viewAllFlightsLink.href = `flight-tracker.html?airport=${airportCode}`;
            
            // Afficher le nom de l'aéroport actif
            const airportName = this.getAirportName(airportCode);
            const airportTitle = document.createElement('div');
            airportTitle.className = 'airport-title';
            airportTitle.innerHTML = `
                <i class="fas fa-plane-departure"></i>
                <h4>${airportName}</h4>
                <div class="flight-stats-badge">
                    <span>${arrivals.length + departures.length} vols</span>
                </div>
            `;
            
            // Remplacer tout titre existant
            const existingTitle = this.flightsContent.querySelector('.airport-title');
            if (existingTitle) {
                existingTitle.replaceWith(airportTitle);
            } else {
                this.flightsContent.insertBefore(airportTitle, this.flightsContent.firstChild);
            }
            
            this.showContent();
        } catch (error) {
            console.error('Erreur lors de la récupération des données de vol:', error);
            this.showError();
        }
    }
    
    /**
     * Met à jour les badges de nombre de vols sur les boutons d'aéroport
     * @param {string} airportCode - Code ICAO de l'aéroport
     * @param {number} arrivals - Nombre d'arrivées
     * @param {number} departures - Nombre de départs
     */
    updateAirportBadges(airportCode, arrivals, departures) {
        const airportItem = document.querySelector(`.airport-item[data-code="${airportCode}"]`);
        if (!airportItem) return;
        
        // Supprimer tout badge existant
        const existingBadge = airportItem.querySelector('.flight-count-badge');
        if (existingBadge) existingBadge.remove();
        
        // Créer et ajouter le nouveau badge
        const badge = document.createElement('div');
        badge.className = 'flight-count-badge';
        badge.innerHTML = `
            <div>${arrivals} <i class="fas fa-plane-arrival"></i></div>
            <div>${departures} <i class="fas fa-plane-departure"></i></div>
        `;
        
        airportItem.querySelector('.airport-item-header').appendChild(badge);
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
     * Affiche l'indicateur de chargement
     */
    showLoading() {
        this.flightsEmpty.style.display = 'none';
        this.flightsContent.style.display = 'none';
        this.flightsLoading.style.display = 'flex';
    }
    
    /**
     * Affiche le contenu des vols
     */
    showContent() {
        this.flightsEmpty.style.display = 'none';
        this.flightsLoading.style.display = 'none';
        this.flightsContent.style.display = 'block';
    }
    
    /**
     * Affiche un message d'erreur
     */
    showError() {
        this.flightsLoading.style.display = 'none';
        this.flightsContent.style.display = 'none';
        this.flightsEmpty.style.display = 'flex';
        this.flightsEmpty.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #e74c3c; margin-bottom: 15px;"></i>
            <p>Impossible de récupérer les données de vol. Veuillez réessayer.</p>
        `;
    }
    
    /**
     * Met à jour le tableau des arrivées
     */
    updateArrivalsTable() {
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

    /**
     * Met à jour les mini aperçus sur tous les éléments d'aéroport
     */
    updateMiniPreviews() {
        // Précharger les données pour tous les aéroports listés
        document.querySelectorAll('.airport-item').forEach(async (item) => {
            const airportCode = item.dataset.code;
            if (!airportCode) return;
            
            try {
                // Calculer période (hier)
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                yesterday.setHours(0, 0, 0, 0);
                const begin = Math.floor(yesterday.getTime() / 1000);
                const end = begin + 86400; // 24 heures
                
                // Récupérer les compteurs
                const [arrivals, departures] = await Promise.all([
                    this.api.getAirportArrivals(airportCode, begin, end),
                    this.api.getAirportDepartures(airportCode, begin, end)
                ]);
                
                // Mettre à jour les compteurs dans le mini aperçu
                const arrivalCount = item.querySelector('.arrival-count');
                const departureCount = item.querySelector('.departure-count');
                
                if (arrivalCount) arrivalCount.textContent = `${arrivals.length} arrivées`;
                if (departureCount) departureCount.textContent = `${departures.length} départs`;
                
            } catch (error) {
                console.error(`Erreur lors de la récupération des données pour ${airportCode}:`, error);
                
                // En cas d'erreur, afficher des données fictives
                const arrivalCount = item.querySelector('.arrival-count');
                const departureCount = item.querySelector('.departure-count');
                
                if (arrivalCount) arrivalCount.textContent = "12-18 arrivées";
                if (departureCount) departureCount.textContent = "15-20 départs";
            }
        });
    }
}

// Initialiser le module lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // S'assurer que la classe OpenSkyAPI est chargée
    if (typeof OpenSkyAPI !== 'undefined') {
        new HotelFlights();
    } else {
        console.error('La classe OpenSkyAPI n\'est pas chargée. Impossible d\'initialiser le suivi des vols.');
    }
});
