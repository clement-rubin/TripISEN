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
        image: 'assets/images/hotels/hotelparis.jpeg', // Réutilisation d'une image existante
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
        name: 'Résidence La Plage',
        location: 'Biarritz, France',
        image: 'assets/images/nice/nice_ext.jpg', // Réutilisation d'une image existante
        rating: 4.5,
        reviews: 65,
        amenities: ['WiFi', 'Plage privée', 'Piscine'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-umbrella-beach', 'fas fa-swimming-pool'],
        price: 195,
        detailUrl: 'hotel-detail-plage.html' // URL CORRIGÉE
    },
    {
        name: 'Auberge du Vieux Port',
        location: 'Marseille, France',
        image: 'assets/images/chalet/chalet_ext.jpg', // Réutilisation d'une image existante
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
        image: 'assets/images/hotels/hotelparis.jpeg', // Réutilisation d'une image existante
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
        name: 'Hôtel de la Cathédrale',
        location: 'Strasbourg, France',
        image: 'assets/images/nice/nice_ext.jpg', // Réutilisation d'une image existante
        rating: 4,
        reviews: 72,
        amenities: ['WiFi', 'Centre-ville', 'Restaurant'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-city', 'fas fa-utensils'],
        price: 165,
        detailUrl: 'hotel-detail-cathedrale.html' // URL CORRIGÉE
    },
    {
        name: 'Les Lodges Montagnards',
        location: 'Annecy, France',
        image: 'assets/images/chalet/chalet_ext.jpg', // Réutilisation d'une image existante
        rating: 4.5,
        reviews: 28,
        amenities: ['WiFi', 'Vue lac', 'Terrasse'],
        amenitiesIcons: ['fas fa-wifi', 'fas fa-water', 'fas fa-umbrella'],
        price: 220,
        badge: 'Nouveau',
        badgeClass: 'new',
        detailUrl: 'hotel-detail-lodges.html' // URL CORRIGÉE
    }
];

// Fonction pour générer les étoiles de notation
function generateRatingStars(rating) {
    // Garder votre fonction existante
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
function generateHotelHTML(hotel) {
    // Garder votre fonction existante
    return `
        <div class="hotel-card">
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

// Code simplifié pour la pagination
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de la page courante
    currentPage = 1;

    // Afficher la première page au chargement
    changePage(1);

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

// Fonction simplifiée pour changer de page
function changePage(pageNumber) {
    console.log("Changement vers la page " + pageNumber);
    
    // Calculer les indices de début et de fin pour les hôtels à afficher
    const startIndex = (pageNumber - 1) * hotelsPerPage;
    const endIndex = startIndex + hotelsPerPage;
    
    // Filtrer les hôtels pour la page actuelle
    const hotelsToDisplay = hotels.slice(startIndex, endIndex);
    
    // Générer le HTML pour les hôtels filtrés
    let hotelsHTML = '';
    hotelsToDisplay.forEach(hotel => {
        hotelsHTML += generateHotelHTML(hotel);
    });
    
    // Mettre à jour le contenu de la liste des hôtels
    document.getElementById('hotels-list').innerHTML = hotelsHTML;
    
    // Mettre à jour l'état actif des boutons de pagination
    document.getElementById('page1Button').classList.remove('active');
    document.getElementById('page2Button').classList.remove('active');
    document.getElementById('page3Button').classList.remove('active');
    document.getElementById('page' + pageNumber + 'Button').classList.add('active');
    
    // Mettre à jour la page courante
    currentPage = pageNumber;
}