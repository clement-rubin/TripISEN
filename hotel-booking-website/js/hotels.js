// Variables globales pour être accessible partout
let currentPage = 1;
const hotelsPerPage = 3;

// Liste des hôtels (garder votre tableau hotels existant)
const hotels = [
    // Page 1
    {
        name: 'Hôtel Luxe Paris',
        location: 'Paris, France',
        image: 'assets/images/hotels/hotelparis.jpeg',
        rating: 4.5,
        reviews: 120,
        amenities: ['WiFi', 'Piscine', 'Restaurant'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-swimming-pool', 'fas fa-utensils'],
        price: 180,
        originalPrice: 225,
        discount: '-20%',
        detailUrl: 'hotel-detail.html?id=1'
    },
    {
        name: 'Resort Méditerranée',
        location: 'Nice, France',
        image: 'assets/images/nice/nice_ext.jpg',
        rating: 4,
        reviews: 87,
        amenities: ['WiFi', 'Piscine', 'Spa'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-swimming-pool', 'fas fa-spa'],
        price: 210,
        detailUrl: 'hotel-detail-mediterranee.html'
    },
    {
        name: 'Chalet Alpin',
        location: 'Chamonix, France',
        image: 'assets/images/chalet/chalet_ext.jpg',
        rating: 5,
        reviews: 45,
        amenities: ['WiFi', 'Vue montagne', 'Cheminée'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-snowflake', 'fas fa-fire'],
        price: 245,
        badge: 'Nouveau',
        badgeClass: 'new',
        detailUrl: 'hotel-detail-alpin.html'
    },
    
    // Page 2
    {
        name: 'Grand Hôtel du Palais',
        location: 'Lyon, France',
        image: 'assets/images/lyon/ext.jpg', // Modifiez ce chemin pour une nouvelle image
        rating: 4,
        reviews: 89,
        amenities: ['WiFi', 'Spa', 'Bar'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-spa', 'fas fa-glass-martini-alt'],
        price: 175,
        originalPrice: 200,
        discount: '-12%',
        detailUrl: 'hotel-detail-palais.html' // URL CORRIGÉE
    },
    {
        name: 'Résidence De La Plage',
        location: 'Biarritz, France',
        image: 'assets/images/biarritz/ext.jpg', // Modifiez ce chemin pour une nouvelle image
        rating: 4.5,
        reviews: 65,
        amenities: ['WiFi', 'Plage privée', 'Piscine'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-umbrella-beach', 'fas fa-swimming-pool'],
        price: 49,
        detailUrl: 'hotel-detail-plage.html' // URL CORRIGÉE
    },
    {
        name: 'Auberge du Vieux Port',
        location: 'Marseille, France',
        image: 'assets/images/marseille/ext.jpeg', // Modifiez ce chemin pour une nouvelle image
        rating: 3.5,
        reviews: 52,
        amenities: ['WiFi', 'Vue mer', 'Restaurant'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-water', 'fas fa-utensils'],
        price: 135,
        detailUrl: 'hotel-detail-port.html' // URL CORRIGÉE
    },
    
    // Page 3
    {
        name: 'Château des Vignes',
        location: 'Bordeaux, France',
        image: 'assets/images/bordeaux/ext.jpg', // Modifiez ce chemin pour une nouvelle image
        rating: 4.5,
        reviews: 38,
        amenities: ['WiFi', 'Vignoble', 'Spa'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-wine-bottle', 'fas fa-spa'],
        price: 290,
        originalPrice: 320,
        discount: '-9%',
        detailUrl: 'hotel-detail-chateau.html' // URL CORRIGÉE
    },
    {
        name: 'Hôtel de L’Ill',
        location: 'Strasbourg, France',
        image: 'assets/images/strasbourg/ext.jpg', // Modifiez ce chemin pour une nouvelle image
        rating: 4,
        reviews: 72,
        amenities: ['WiFi', 'Centre-ville', 'Restaurant'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-city', 'fas fa-utensils'],
        price: 165,
        detailUrl: 'hotel-detail-cathedrale.html' // URL CORRIGÉE
    },
    {
        name: 'Les Trésoms Lake and Spa Resort',
        location: 'Annecy, France',
        image: 'assets/images/annecy/ext.jpg', // Modifiez ce chemin pour une nouvelle image
        rating: 4.5,
        reviews: 28,
        amenities: ['WiFi', 'Vue lac', 'Terrasse', 'Spa'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-water', 'fas fa-umbrella', 'fas fa-spa'],
        price: 220,
        badge: 'Nouveau',
        badgeClass: 'new',
        detailUrl: 'hotel-detail-lodges.html' // URL CORRIGÉE
    }
];

// Fonction pour générer les étoiles de notation
function generateRatingStars(rating) {
    let starsHTML = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    
    return starsHTML;
}

// Fonction pour générer le HTML d'un hôtel
function generateHotelHTML(hotel, index) {
    const pageNumber = Math.floor(index / hotelsPerPage) + 1;
    const displayStyle = pageNumber === 1 ? 'block' : 'none';
    
    return `
        <div class="hotel-card" data-page="${pageNumber}" style="display: ${displayStyle};">
            <div class="hotel-image">
                <img src="${hotel.image}" alt="${hotel.name}">
                ${hotel.discount ? `<div class="hotel-badge">${hotel.discount}</div>` : ''}
                ${hotel.badge ? `<div class="hotel-badge ${hotel.badgeClass}">${hotel.badge}</div>` : ''}
            </div>
            <div class="hotel-info">
                <h3>${hotel.name}</h3>
                <div class="hotel-location"><i class="fas fa-map-marker-alt"></i> ${hotel.location}</div>
                <div class="hotel-rating">
                    ${generateRatingStars(hotel.rating)}
                    <span>(${hotel.reviews} avis)</span>
                </div>
                <div class="hotel-amenities">
                    ${hotel.amenities.map((amenity, index) => 
                        `<span><i class="${hotel.amenitiesIcons[index]}"></i> ${amenity}</span>`
                    ).join('')}
                </div>
                <div class="hotel-price">
                    <span class="price">${hotel.price}€</span>
                    <span class="per-night">/ nuit</span>
                    ${hotel.originalPrice ? `<span class="original-price">${hotel.originalPrice}€</span>` : ''}
                </div>
                <a href="${hotel.detailUrl}" class="btn btn-primary">Voir détails</a>
            </div>
        </div>
    `;
}

// Fonction pour générer tout le HTML des hôtels
function generateAllHotelsHTML() {
    let hotelsHTML = '';
    hotels.forEach((hotel, index) => {
        hotelsHTML += generateHotelHTML(hotel, index);
    });
    
    // Mettre à jour le contenu de la liste des hôtels
    document.getElementById('hotels-list').innerHTML = hotelsHTML;
}

// Code simplifié pour la pagination
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de la page courante
    currentPage = 1;

    // Afficher tous les hôtels au chargement, mais seuls ceux de la page 1 sont visibles
    generateAllHotelsHTML();

    // Configurer les écouteurs d'événements pour les boutons de pagination
    document.getElementById('page1Button').addEventListener('click', function(e) {
        e.preventDefault();
        changePage(1);
    });
    
    document.getElementById('page2Button').addEventListener('click', function(e) {
        e.preventDefault();
        changePage(2);
    });
    
    document.getElementById('page3Button').addEventListener('click', function(e) {
        e.preventDefault();
        changePage(3);
    });
    
    document.getElementById('nextButton').addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage < 3) {
            changePage(currentPage + 1);
        }
    });
});

// Fonction pour changer de page en affichant/masquant les hôtels
function changePage(pageNumber) {
    console.log("Changement vers la page " + pageNumber);
    
    // Afficher/masquer les hôtels en fonction du numéro de page
    const hotelCards = document.querySelectorAll('.hotel-card');
    hotelCards.forEach(card => {
        if (parseInt(card.dataset.page) === pageNumber) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Mettre à jour l'état actif des boutons de pagination
    document.getElementById('page1Button').classList.remove('active');
    document.getElementById('page2Button').classList.remove('active');
    document.getElementById('page3Button').classList.remove('active');
    document.getElementById('page' + pageNumber + 'Button').classList.add('active');
    
    // Mettre à jour la page courante
    currentPage = pageNumber;
}