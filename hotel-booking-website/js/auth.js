document.addEventListener('DOMContentLoaded', function() {
    // Système d'onglets pour connexion/inscription
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Désactive tous les onglets et formulaires
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            // Active l'onglet et le formulaire sélectionnés
            this.classList.add('active');
            
            // Afficher le formulaire correspondant
            const formId = this.getAttribute('data-tab') + '-form';
            document.getElementById(formId).classList.add('active');
        });
    });
    
    // Toggle pour afficher/masquer le mot de passe
    const togglePasswordVisibility = function(inputId) {
        const passwordInput = document.getElementById(inputId);
        const icon = passwordInput.nextElementSibling;
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };
    
    // Vérifier si l'utilisateur est connecté
    checkLoginStatus();
    
    // Ajouter un gestionnaire d'événement pour le bouton de déconnexion
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Fonction d'initialisation globale que nous pouvons appeler depuis n'importe quelle page
function initAuth() {
    checkLoginStatus();
}

// Vérifier le statut de connexion de l'utilisateur
function checkLoginStatus() {
    fetch('php/check_login.php')
        .then(response => {
            // Vérifier la réponse brute pour le débogage
            return response.text().then(text => {
                try {
                    // Essayer de parser le JSON
                    const data = JSON.parse(text);
                    return data;
                } catch (e) {
                    // En cas d'erreur de parsing, afficher le texte brut
                    console.error("Réponse non-JSON reçue:", text);
                    throw new Error("Réponse invalide du serveur: " + text);
                }
            });
        })
        .then(data => {
            if (data.isLoggedIn) {
                // L'utilisateur est connecté
                const guestActions = document.getElementById('guest-actions');
                const userActions = document.getElementById('user-actions');
                const username = document.getElementById('username');
                
                if (guestActions && userActions && username) {
                    guestActions.style.display = 'none';
                    userActions.style.display = 'block';
                    username.textContent = data.username;
                }
            } else {
                // L'utilisateur n'est pas connecté
                const guestActions = document.getElementById('guest-actions');
                const userActions = document.getElementById('user-actions');
                
                if (guestActions && userActions) {
                    guestActions.style.display = 'block';
                    userActions.style.display = 'none';
                }
                
                // Rediriger vers login.html si on est sur profile.html
                if (window.location.pathname.includes('profile.html')) {
                    window.location.href = 'login.html';
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification du statut de connexion:', error);
            
            // En cas d'erreur, utiliser localStorage comme fallback
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            const guestActions = document.getElementById('guest-actions');
            const userActions = document.getElementById('user-actions');
            const username = document.getElementById('username');
            
            if (guestActions && userActions) {
                if (isLoggedIn) {
                    guestActions.style.display = 'none';
                    userActions.style.display = 'block';
                    if (username && userData.name) {
                        username.textContent = userData.name;
                    }
                } else {
                    guestActions.style.display = 'block';
                    userActions.style.display = 'none';
                }
            }
        });
}

// Fonction de déconnexion
function logout() {
    fetch('php/logout.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Rediriger vers la page d'accueil après déconnexion
                window.location.href = 'index.html';
            } else {
                alert('Erreur lors de la déconnexion. Veuillez réessayer.');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la déconnexion:', error);
        });
}

// Exporter les fonctions pour les rendre accessibles globalement
window.initAuth = initAuth;
window.logout = logout;
