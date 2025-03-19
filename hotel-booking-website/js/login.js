document.addEventListener('DOMContentLoaded', function() {
    // Gestion des onglets
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Supprimer la classe active de tous les onglets et formulaires
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            // Ajouter la classe active à l'onglet cliqué
            this.classList.add('active');
            
            // Afficher le formulaire correspondant
            const formId = this.getAttribute('data-tab') + '-form';
            document.getElementById(formId).classList.add('active');
        });
    });
    
    // Gestion du formulaire de connexion
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me') ? document.getElementById('remember-me').checked : false;
            
            // Afficher le message de chargement
            const errorElem = document.getElementById('login-error');
            errorElem.textContent = "Connexion en cours...";
            errorElem.style.display = 'block';
            
            console.log("Tentative de connexion avec email:", email);
            
            const loginData = {
                email: email,
                password: password,
                remember_me: rememberMe
            };
            
            fetch('php/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            })
            .then(response => {
                console.log("Statut de la réponse:", response.status);
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
                console.log('Réponse de login:', data);
                
                if (data.success) {
                    // Stocker l'email et le statut connecté dans localStorage
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    // Créer ou mettre à jour les données utilisateur dans localStorage
                    if (data.user) {
                        console.log('Sauvegarde des données utilisateur:', data.user);
                        localStorage.setItem('userData', JSON.stringify(data.user));
                    } else {
                        // Si le serveur ne renvoie pas de données utilisateur, créer un objet minimal
                        const username = email.split('@')[0];
                        const userData = {
                            name: username.charAt(0).toUpperCase() + username.slice(1),
                            email: email
                        };
                        localStorage.setItem('userData', JSON.stringify(userData));
                    }
                    
                    // Redirection vers la page d'accueil
                    window.location.href = 'index.html';
                } else {
                    // Afficher un message d'erreur
                    errorElem.textContent = data.message || 'Identifiants incorrects. Veuillez réessayer.';
                    errorElem.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Erreur lors de la connexion:', error);
                errorElem.textContent = 'Une erreur est survenue. Veuillez réessayer plus tard.';
                errorElem.style.display = 'block';
            });
        });
    }
    
    // Gestion du formulaire d'inscription
    const registerForm = document.getElementById('form-register');
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Vérifier que les mots de passe correspondent
        if (password !== confirmPassword) {
            document.getElementById('register-error').textContent = 'Les mots de passe ne correspondent pas.';
            return;
        }
        
        const registerData = {
            name: name,
            email: email,
            password: password
        };
        
        // Afficher un message de chargement
        document.getElementById('register-error').textContent = 'Traitement en cours...';
        
        fetch('php/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        })
        .then(response => {
            // Vérifier si la réponse est OK
            if (!response.ok) {
                throw new Error('Erreur réseau: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Réponse du serveur:', data); // Ajouter pour débogage
            
            if (data.success) {
                // Redirection vers la page de connexion avec message de succès
                alert('Compte créé avec succès! Vous pouvez maintenant vous connecter.');
                
                // Basculer vers l'onglet de connexion
                document.querySelector('[data-tab="login"]').click();
            } else {
                // Afficher un message d'erreur
                document.getElementById('register-error').textContent = data.message || 'Erreur lors de la création du compte.';
                console.error('Détails de l\'erreur:', data);
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'inscription:', error);
            document.getElementById('register-error').textContent = 'Une erreur est survenue. Veuillez réessayer plus tard. (' + error.message + ')';
        });
    });
});
