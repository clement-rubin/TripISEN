document.addEventListener('DOMContentLoaded', function() {
    // Affichage de l'interface utilisateur connecté/non-connecté
    updateUserInterface();
    
    // Gestion des onglets de profil
    const tabs = document.querySelectorAll('.profile-menu li');
    const tabContents = document.querySelectorAll('.profile-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Supprimer la classe active de tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            
            // Cacher tous les contenus d'onglets
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Ajouter la classe active à l'onglet cliqué
            this.classList.add('active');
            
            // Afficher le contenu correspondant
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Charger les informations de l'utilisateur
    loadUserProfile();
    
    // Formulaire des informations personnelles
    const personalInfoForm = document.getElementById('personal-info-form');
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updatePersonalInfo();
        });
    }
    
    // Formulaire de changement de mot de passe
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updatePassword();
        });
    }
    
    // Formulaire de préférences
    const preferencesForm = document.getElementById('preferences-form');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updatePreferences();
        });
    }
    
    // Gestion des réservations
    loadUserBookings();
});

// Mettre à jour l'interface utilisateur en fonction de l'état de connexion
function updateUserInterface() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        // Au lieu de rediriger, nous simulons une connexion avec l'email de l'utilisateur
        promptUserForLogin();
    } else {
        // Afficher le panneau utilisateur
        document.getElementById('guest-actions').style.display = 'none';
        document.getElementById('user-actions').style.display = 'block';
        
        // S'assurer que l'email affiché est à jour
        updateUserDisplayInfo();
    }
}

// Demander à l'utilisateur de se connecter
function promptUserForLogin() {
    // Vérifier si nous avons déjà un email stocké
    const userEmail = localStorage.getItem('userEmail');
    
    if (userEmail && validateEmail(userEmail)) {
        // Si nous avons déjà un email valide, simuler une connexion directe
        simulateLogin(userEmail);
    } else {
        // Sinon demander l'email via une boite de dialogue
        let newEmail = prompt("Veuillez entrer votre adresse e-mail pour accéder à votre profil:", "");
        
        if (newEmail && validateEmail(newEmail)) {
            simulateLogin(newEmail);
        } else {
            // Si l'utilisateur annule ou entre un email invalide, demander à nouveau
            alert("Une adresse e-mail valide est nécessaire pour accéder à votre profil.");
            
            // Essayer à nouveau avec une valeur par défaut
            newEmail = prompt("Veuillez entrer une adresse e-mail valide:", "exemple@domaine.com");
            
            if (newEmail && validateEmail(newEmail)) {
                simulateLogin(newEmail);
            } else {
                // Si encore invalide, rediriger vers l'accueil
                window.location.href = 'index.html';
            }
        }
    }
}

// Valider le format de l'email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Simuler une connexion pour la démonstration avec l'email fourni
function simulateLogin(email) {
    if (!email || !validateEmail(email)) {
        console.error("Email invalide fourni à simulateLogin");
        return;
    }
    
    // Sauvegarder l'email pour les futures visites
    localStorage.setItem('userEmail', email);
    
    // Créer un nom d'utilisateur à partir de l'email (partie avant le @)
    const username = email.split('@')[0];
    
    const userData = {
        name: username.charAt(0).toUpperCase() + username.slice(1), // Première lettre en majuscule
        email: email,
        phone: '06 12 34 56 78',
        address: '123 Rue de la Paix',
        city: 'Lille',
        postal_code: '59000',
        country: 'France',
        preferences: {
            newsletters: true,
            offers: true,
            language: 'fr'
        }
    };
    
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
    
    // Simuler quelques réservations pour la démonstration
    const demoBookings = [
        {
            id: 1,
            hotel: 'Hôtel Luxe Paris',
            checkIn: '2023-11-20',
            checkOut: '2023-11-25',
            guests: '2 adultes',
            status: 'À venir',
            total: '850'
        },
        {
            id: 2,
            hotel: 'Resort Méditerranée',
            checkIn: '2023-09-10',
            checkOut: '2023-09-17',
            guests: '2 adultes, 1 enfant',
            status: 'Terminée',
            total: '1200'
        }
    ];
    
    if (!localStorage.getItem('userBookings')) {
        localStorage.setItem('userBookings', JSON.stringify(demoBookings));
    }
    
    // Mettre à jour l'interface utilisateur avec le nouvel état de connexion
    document.getElementById('guest-actions').style.display = 'none';
    document.getElementById('user-actions').style.display = 'block';
    
    // Mettre à jour les informations affichées
    updateUserDisplayInfo();
}

// Mettre à jour les informations d'affichage de l'utilisateur
function updateUserDisplayInfo() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) return;
    
    // Mettre à jour le nom d'utilisateur dans la barre de navigation
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = userData.name;
    }
    
    // Mettre à jour les informations de la sidebar si on est sur la page profil
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarEmail = document.getElementById('sidebar-email');
    
    if (sidebarUsername) {
        sidebarUsername.textContent = userData.name;
    }
    
    if (sidebarEmail) {
        sidebarEmail.textContent = userData.email;
    }
}

// Vérifier si l'utilisateur est connecté
function checkIfLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Charger le profil de l'utilisateur
function loadUserProfile() {
    showLoading();
    
    // Utiliser une approche hybride : vérifier à la fois les données locales et le serveur
    const storedUserData = JSON.parse(localStorage.getItem('userData')) || {};
    
    // Pré-remplir le formulaire avec les données locales pour une réponse immédiate
    if (storedUserData && Object.keys(storedUserData).length > 0) {
        fillProfileForm(storedUserData);
    }
    
    // Ensuite, faire la requête au serveur pour obtenir les données les plus récentes
    fetch('php/get_user_profile.php')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mettre à jour les informations locales
            const userData = data.user;
            
            // Sauvegarder dans le stockage local pour cohérence avec les autres parties du site
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('userEmail', userData.email);
            localStorage.setItem('isLoggedIn', 'true');
            
            // Remplir le formulaire avec les données du serveur
            fillProfileForm(userData);
        } else {
            console.warn('Échec du chargement du profil:', data.message);
            // Si l'API échoue, et qu'on n'a pas déjà des données locales, demander login
            if (!storedUserData || Object.keys(storedUserData).length === 0) {
                if (!checkIfLoggedIn()) {
                    promptUserForLogin();
                }
            }
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Erreur lors du chargement du profil:', error);
        // En cas d'erreur, utiliser les données locales déjà chargées
        hideLoading();
    });
}

// Nouvelle fonction pour remplir le formulaire de profil
function fillProfileForm(userData) {
    // Mettre à jour les informations de la sidebar
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarEmail = document.getElementById('sidebar-email');
    const usernameElement = document.getElementById('username');
    
    if (sidebarUsername) sidebarUsername.textContent = userData.name || 'Utilisateur';
    if (sidebarEmail) sidebarEmail.textContent = userData.email || '';
    if (usernameElement) usernameElement.textContent = userData.name || 'Utilisateur';
    
    // Remplir le formulaire d'informations personnelles
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const phoneField = document.getElementById('phone');
    const addressField = document.getElementById('address');
    const cityField = document.getElementById('city');
    const postalCodeField = document.getElementById('postal_code');
    const countryField = document.getElementById('country');
    
    if (nameField) nameField.value = userData.name || '';
    if (emailField) emailField.value = userData.email || '';
    if (phoneField) phoneField.value = userData.phone || '';
    if (addressField) addressField.value = userData.address || '';
    if (cityField) cityField.value = userData.city || '';
    if (postalCodeField) postalCodeField.value = userData.postal_code || '';
    if (countryField) countryField.value = userData.country || '';
    
    // Remplir les préférences si disponibles
    if (userData.preferences) {
        const newsletters = document.getElementById('newsletters');
        const offers = document.getElementById('special_offers');
        const language = document.getElementById('language');
        
        if (newsletters) newsletters.checked = userData.preferences.newsletters;
        if (offers) offers.checked = userData.preferences.offers;
        if (language) language.value = userData.preferences.language || 'fr';
    }
}

// Mettre à jour les informations personnelles
function updatePersonalInfo() {
    showLoading();
    
    // Récupérer les valeurs actuelles des champs
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const postal_code = document.getElementById('postal_code').value;
    const country = document.getElementById('country').value;
    
    // Validation des champs
    if (!name.trim() || !email.trim() || !validateEmail(email)) {
        showMessage('update-info-message', 'Le nom et une adresse e-mail valide sont obligatoires', 'error');
        hideLoading();
        return;
    }
    
    // Préparer les données à envoyer
    const userData = {
        name,
        email,
        phone,
        address,
        city,
        postal_code,
        country
    };
    
    console.log("Envoi des données de profil:", userData);
    
    // Envoyer les données au serveur
    fetch('php/update_profile.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Réponse du serveur:", data);
        
        if (data.success) {
            // Mettre à jour aussi le stockage local pour la cohérence
            // Récupérer d'abord les données existantes pour préserver les autres propriétés
            const existingData = JSON.parse(localStorage.getItem('userData')) || {};
            const updatedData = {...existingData, ...userData};
            
            localStorage.setItem('userData', JSON.stringify(updatedData));
            localStorage.setItem('userEmail', email);
            localStorage.setItem('isLoggedIn', 'true');
            
            // Mettre à jour l'affichage
            document.getElementById('sidebar-username').textContent = name;
            document.getElementById('sidebar-email').textContent = email;
            document.getElementById('username').textContent = name;
            
            showMessage('update-info-message', data.message || 'Informations personnelles mises à jour avec succès', 'success');
        } else {
            showMessage('update-info-message', data.message || 'Erreur lors de la mise à jour', 'error');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Erreur:', error);
        showMessage('update-info-message', 'Une erreur est survenue lors de la communication avec le serveur', 'error');
        hideLoading();
    });
}

// Mettre à jour le mot de passe
function updatePassword() {
    showLoading();
    
    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    // Validation des champs
    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('update-password-message', 'Tous les champs sont obligatoires', 'error');
        hideLoading();
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('update-password-message', 'Les mots de passe ne correspondent pas', 'error');
        hideLoading();
        return;
    }
    
    if (newPassword.length < 8) {
        showMessage('update-password-message', 'Le mot de passe doit contenir au moins 8 caractères', 'error');
        hideLoading();
        return;
    }
    
    // Simuler l'envoi des données (à remplacer par un vrai appel API)
    setTimeout(() => {
        // Dans une vraie application, on vérifierait ici que le mot de passe actuel est correct
        
        showMessage('update-password-message', 'Mot de passe mis à jour avec succès', 'success');
        document.getElementById('change-password-form').reset();
        hideLoading();
    }, 800);
}

// Mettre à jour les préférences
function updatePreferences() {
    showLoading();
    
    const newsletters = document.getElementById('newsletters').checked;
    const offers = document.getElementById('special_offers').checked;
    const language = document.getElementById('language').value;
    
    // Préparer les données à envoyer
    const preferencesData = {
        newsletters,
        offers,
        language
    };
    
    // Envoyer les données au serveur
    fetch('php/update_preferences.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferencesData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mettre à jour aussi le stockage local pour la cohérence
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            userData.preferences = preferencesData;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            showMessage('update-preferences-message', 'Préférences mises à jour avec succès', 'success');
        } else {
            showMessage('update-preferences-message', data.message || 'Erreur lors de la mise à jour', 'error');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Erreur:', error);
        showMessage('update-preferences-message', 'Une erreur est survenue lors de la communication avec le serveur', 'error');
        hideLoading();
    });
}

// Annuler une réservation
function cancelBooking(bookingId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
        return;
    }
    
    showLoading();
    
    // Simuler l'annulation (à remplacer par un vrai appel API)
    setTimeout(() => {
        // Récupérer les réservations
        const bookings = JSON.parse(localStorage.getItem('userBookings')) || [];
        
        // Mettre à jour le statut de la réservation
        const updatedBookings = bookings.map(booking => {
            if (booking.id == bookingId) {
                return { ...booking, status: 'Annulée' };
            }
            return booking;
        });
        
        // Sauvegarder dans le stockage local (simulation)
        localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
        
        // Recharger les réservations
        loadUserBookings();
        
        showMessage('booking-message', 'Réservation annulée avec succès', 'success');
        hideLoading();
    }, 800);
}

// Fonctions utilitaires pour l'UI
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = 'message ' + type;
        
        // Faire disparaître le message après 5 secondes
        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.className = 'message';
        }, 5000);
    }
}

function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}
