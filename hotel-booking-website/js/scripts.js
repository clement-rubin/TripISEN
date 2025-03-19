// Common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Determine which page we're on
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Common functionality for all pages
    initializeNavbar();
    checkLoginStatus();
    initializeLogoutButton();
    
    // Page-specific functionality
    switch(currentPage) {
        case 'index.html':
            initializeHomePage();
            break;
        case 'hotels.html':
            initializeHotelsPage();
            break;
        case 'reservations.html':
            initializeReservationsPage();
            break;
        case 'promotions.html':
            initializePromotionsPage();
            break;
        case 'contact.html':
            initializeContactPage();
            break;
        case 'profile.html':
            // La page profil a son propre script d'initialisation
            break;
    }
});

// Vérifier si l'utilisateur est connecté et mettre à jour l'interface
function checkLoginStatus() {
    // Vérifier à la fois les données de session PHP et localStorage
    fetch('php/check_login.php')
        .then(response => response.json())
        .then(serverData => {
            // Si connecté côté serveur, mettre à jour localStorage
            if (serverData.isLoggedIn) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', serverData.email);
            }
            
            // Continuer avec vérification localStorage pour l'affichage UI
            completeLoginCheck();
        })
        .catch(error => {
            console.error('Erreur lors de la vérification du statut de connexion:', error);
            // En cas d'erreur, continuer avec vérification localStorage
            completeLoginCheck();
        });
}

// Compléter la vérification de connexion avec localStorage
function completeLoginCheck() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
    // Si nous avons un email stocké mais pas de userData, créer des données fictives
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail && (!userData || !userData.email) && validateEmail(userEmail)) {
        const username = userEmail.split('@')[0];
        const newUserData = {
            name: username.charAt(0).toUpperCase() + username.slice(1),
            email: userEmail,
        };
        localStorage.setItem('userData', JSON.stringify(newUserData));
    }
    
    // Mettre à jour l'interface utilisateur
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    
    if (guestActions && userActions) {
        if (isLoggedIn) {
            guestActions.style.display = 'none';
            userActions.style.display = 'block';
            
            // Mettre à jour le nom d'utilisateur
            const usernameElement = document.getElementById('username');
            if (usernameElement && userData && userData.name) {
                usernameElement.textContent = userData.name;
            }
        } else {
            guestActions.style.display = 'block';
            userActions.style.display = 'none';
        }
    }
}

// Valider le format de l'email (fonction utilitaire dupliquée pour être disponible dans scripts.js)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Initialiser le bouton de déconnexion
function initializeLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // On garde l'email dans le stockage local mais on déconnecte l'utilisateur
            const userEmail = localStorage.getItem('userEmail');
            
            // Appeler l'API de déconnexion PHP
            fetch('php/logout.php')
                .then(response => response.json())
                .then(data => {
                    // Nettoyage côté client quelle que soit la réponse du serveur
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('userData');
                    localStorage.removeItem('userBookings');
                    
                    // On conserve l'email pour faciliter la reconnexion
                    if (userEmail) {
                        localStorage.setItem('userEmail', userEmail);
                    }
                    
                    // Rediriger vers la page d'accueil
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    console.error('Erreur lors de la déconnexion:', error);
                    // En cas d'erreur, faire le nettoyage côté client quand même
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('userData');
                    localStorage.removeItem('userBookings');
                    
                    // On conserve l'email pour faciliter la reconnexion
                    if (userEmail) {
                        localStorage.setItem('userEmail', userEmail);
                    }
                    
                    // Rediriger vers la page d'accueil
                    window.location.href = 'index.html';
                });
        });
    }
}

// Navbar functionality
function initializeNavbar() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            hamburger.classList.toggle('active');
        });
    }
}

// Page-specific functions
function initializeHomePage() {
    // Code from index.js
    console.log('Home page initialized');
    // Add all functionality from index.js here
}

function initializeHotelsPage() {
    // Code from hotels.js
    console.log('Hotels page initialized');
    // Add all functionality from hotels.js here
}

function initializeReservationsPage() {
    // Code from reservations.js
    console.log('Reservations page initialized');
    // Add all functionality from reservations.js here
}

function initializePromotionsPage() {
    // Code from promotions.js
    console.log('Promotions page initialized');
    // Add all functionality from promotions.js here
}

function initializeContactPage() {
    // Code from contact.js
    console.log('Contact page initialized');
    
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Form submission logic here
            alert('Message envoyé avec succès!');
            this.reset();
        });
    }
}