// filepath: /c:/Users/clement.rubin/OneDrive - JUNIA Grande école d'ingénieurs/Documents/COURS CIR 2/SEM 2/WEB/Projet/Projet_JS/js/main.js

document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchButton = document.querySelector('.search-box button');
    const searchInput = document.querySelector('.search-input-container input');

    searchButton.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            // Redirect to hotels page with search query
            window.location.href = `hotels.html?search=${encodeURIComponent(query)}`;
        } else {
            alert('Veuillez entrer une destination.');
        }
    });

    // Responsive navigation
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navLinks.contains(event.target) || hamburger.contains(event.target);
        
        if (!isClickInsideNav && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });

    // Highlight active navigation link
    const currentLocation = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-links li');
    
    navItems.forEach(item => {
        const link = item.querySelector('a');
        const href = link.getAttribute('href');
        
        if (currentLocation.includes(href) && href !== 'index.html') {
            item.classList.add('active');
        } else if (currentLocation.endsWith('/') || currentLocation.endsWith('index.html')) {
            if (href === 'index.html') {
                item.classList.add('active');
            }
        }
    });

    // Vérifier l'authentification sur toutes les pages
    if (typeof initAuth === 'function') {
        initAuth();
    } else {
        // Si auth.js n'est pas encore chargé, attendre un peu
        setTimeout(function() {
            if (typeof initAuth === 'function') {
                initAuth();
            } else {
                console.error("Le script d'authentification n'est pas chargé correctement");
            }
        }, 500);
    }

    // Nouveau code pour la recherche d'hôtels
    setupHotelSearch();
});

/**
 * Configure le système de recherche d'hôtel
 */
function setupHotelSearch() {
    // Identifier tous les éléments de recherche possibles
    const searchForms = document.querySelectorAll('.search-box, form.search-form');
    const searchInputs = document.querySelectorAll('.search-box input, input[type="search"], .search-input-container input');
    const searchButtons = document.querySelectorAll('.search-box button, button[type="submit"]');

    // Charger les données des hôtels depuis la base de données via AJAX
    let hotels = [];
    
    fetch('php/get_hotels.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                hotels = data.hotels;
                console.log('Hôtels chargés:', hotels);
            } else {
                console.error('Erreur lors du chargement des hôtels:', data.message);
            }
        })
        .catch(error => {
            console.error('Erreur AJAX:', error);
        });

    // Fonction pour normaliser le texte (supprimer les accents, mettre en minuscule)
    function normalizeText(text) {
        if (!text) return '';
        return text.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    // Fonction pour rechercher un hôtel
    function searchHotel(query) {
        const normalizedQuery = normalizeText(query);
        
        // Si la requête est vide
        if (!normalizedQuery) return null;
        
        console.log('Recherche hôtel pour:', normalizedQuery);
        
        // Rechercher par ville
        const hotelsByCity = hotels.filter(hotel => 
            normalizeText(hotel.city).includes(normalizedQuery)
        );
        
        if (hotelsByCity.length > 0) {
            console.log('Correspondance par ville trouvée:', hotelsByCity[0]);
            return hotelsByCity[0];
        }
        
        // Rechercher par nom d'hôtel
        const hotelsByName = hotels.filter(hotel => 
            normalizeText(hotel.hotel_name).includes(normalizedQuery)
        );
        
        if (hotelsByName.length > 0) {
            console.log('Correspondance par nom trouvée:', hotelsByName[0]);
            return hotelsByName[0];
        }
        
        return null;
    }

    // Fonction de gestion de la recherche
    function handleSearch(searchValue) {
        if (!searchValue) return false;
        
        const hotel = searchHotel(searchValue);
        
        if (hotel) {
            // Rediriger vers la page détail avec l'ID de l'hôtel
            window.location.href = `hotel-detail.html?id=${hotel.hotel_id}`;
            return true;
        } else {
            // Si pas de correspondance directe, rediriger vers la page des hôtels
            window.location.href = `hotels.html?search=${encodeURIComponent(searchValue)}`;
            return true;
        }
    }

    // Attacher les gestionnaires d'événements aux formulaires
    searchForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = this.querySelector('input[type="text"], input[type="search"]');
            if (input) {
                handleSearch(input.value);
            }
        });
    });

    // Attacher les gestionnaires d'événements aux champs de recherche (touche Entrée)
    searchInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(this.value);
            }
        });
    });

    // Attacher les gestionnaires d'événements aux boutons de recherche
    searchButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const form = this.closest('form') || this.closest('.search-box');
            if (form) {
                const input = form.querySelector('input[type="text"], input[type="search"]');
                if (input) {
                    handleSearch(input.value);
                }
            }
        });
    });
}