# 🏨 Trip'ISEN - Plateforme de Réservation d'Hôtels

![Trip'ISEN Banner](hotel-booking-website/assets/images/hotel_accueil.jpg)

## 📋 Table des matières
- [Introduction](#introduction)
- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Structure du projet](#structure-du-projet)
- [Utilisation de JavaScript](#utilisation-de-javascript)
- [Interactivité & Expérience Utilisateur](#interactivité--expérience-utilisateur)
- [Innovation & Originalité](#innovation--originalité)
- [Qualité de code & Bonnes pratiques](#qualité-de-code--bonnes-pratiques)
- [Fonctionnalité & Performance](#fonctionnalité--performance)
- [Installation et déploiement](#installation-et-déploiement)
- [License](#license)

## 📝 Introduction

Trip'ISEN est une plateforme complète de réservation d'hôtels offrant une expérience utilisateur immersive et intuitive. Le site permet aux utilisateurs de rechercher, consulter et réserver des hôtels dans diverses destinations, avec une interface moderne et responsive qui s'adapte à tous les appareils.

## ✨ Fonctionnalités

- **Page d'accueil**: Recherche rapide d'hôtels, présentation des établissements en vedette et témoignages clients
- **Catalogue d'hôtels**: Liste détaillée des hôtels avec filtres par localisation, prix et commodités
- **Fiches détaillées des hôtels**: Informations complètes, galeries photos, avis clients, et options de réservation
- **Système de réservation**: Processus en plusieurs étapes avec sélection de dates, chambres, et paiement
- **Suivi des vols**: Intégration API pour vérifier les vols à proximité des hôtels sélectionnés
- **Météo locale**: Affichage des prévisions météo pour les destinations des hôtels
- **Espace client**: Gestion des réservations, profil utilisateur et préférences
- **Page promotions**: Offres spéciales et réductions temporaires
- **Formulaire de contact**: Support client et demandes d'information
- **Authentification**: Système de connexion et d'inscription sécurisé

## 💻 Technologies utilisées

- **Frontend**: 
  - HTML5
  - CSS3 (avec variables CSS personnalisées)
  - JavaScript (ES6+)
- **API externes**:
  - OpenSky Network API (suivi des vols)
  - Meteoblue API (prévisions météo)
  - Google Maps (intégration cartographique)
- **Backend**:
  - PHP (pour traitement formulaires et API)
  - MySQL (base de données)
- **Outils supplémentaires**:
  - Font Awesome (icônes)
  - Google Fonts
  - jQuery (minimalement)

## 📁 Structure du projet

Le projet est organisé de manière modulaire pour faciliter la maintenance :

```
TripISEN
├── hotel-booking-website/
│   ├── index.html               # Page d'accueil
│   ├── hotels.html              # Catalogue des hôtels
│   ├── hotel-detail-*.html      # Pages détaillées par hôtel
│   ├── reservations.html        # Système de réservation
│   ├── flight-tracker.html      # Suivi des vols
│   ├── profile.html             # Profil utilisateur
│   ├── login.html               # Authentification
│   ├── contact.html             # Formulaire de contact
│   ├── css/                     # Styles CSS
│   ├── js/                      # Scripts JavaScript
│   ├── assets/                  # Images et ressources
│   ├── php/                     # Scripts PHP pour backend
│   ├── sql/                     # Fichiers SQL pour base de données
│   └── templates/               # Éléments réutilisables
├── opensky-api/                 # API intégrée pour les vols
└── README.md                    # Documentation
```

## 🚀 Utilisation de JavaScript

Le projet utilise JavaScript de manière extensive et efficace :

### JavaScript Vanilla
- **Manipulation du DOM** pour créer des interfaces dynamiques
- **Gestion d'événements** pour les interactions utilisateur
- **Requêtes API asynchrones** avec Fetch API et async/await
- **Classes ES6** pour une programmation orientée objet modulaire
- **Stockage local** (localStorage) pour les préférences utilisateur

### Modularité du code
Le JavaScript est organisé en modules fonctionnels :
- `main.js` : Fonctionnalités partagées et initialisation
- `hotel-detail.js` : Logique spécifique aux pages de détail d'hôtel
- `reservations.js` : Système de réservation et tarification
- `opensky-api.js` : Intégration de l'API de suivi des vols
- `hotel-weather.js` : Gestion des données météorologiques
- `auth.js` : Authentification et gestion de session

### Exemples d'implémentation
```javascript
// Exemple de classe pour l'intégration des vols
class FlightIntegration {
    constructor() {
        this.hotelAirports = {
            'hotel1': [
                { code: 'LFPG', name: 'Paris Charles de Gaulle', distance: '23km' },
                { code: 'LFPO', name: 'Paris Orly', distance: '35km' }
            ],
            // Autres aéroports...
        };
        this.initializeElements();
        this.bindEvents();
    }
    
    async checkFlights() {
        // Récupération des données de vol en temps réel
        // ...
    }
    
    // Autres méthodes...
}
```

## 🎨 Interactivité & Expérience Utilisateur

Le projet offre une expérience utilisateur riche et engageante :

### Éléments interactifs
- **Carrousels d'images** avec navigation tactile sur mobile
- **Filtres dynamiques** pour la recherche d'hôtels (prix, localisation, commodités)
- **Formulaires progressifs** avec validation en temps réel
- **Notifications** pour les actions utilisateur
- **Indicateurs de chargement** pour les opérations asynchrones

### Animations et transitions
- Transitions fluides entre les étapes de réservation
- Animations d'apparition des éléments au défilement
- Effets subtils sur les interactions (survol, clic)
- Transitions d'état pour améliorer le retour visuel

### Expérience responsive
- Interface adaptative pour tous les appareils
- Navigation simplifiée sur mobile avec menu hamburger
- Disposition optimisée des éléments selon la taille d'écran

## 💡 Innovation & Originalité

Le projet se distingue par plusieurs fonctionnalités innovantes :

### Intégration de données en temps réel
- **API OpenSky** pour afficher les vols à proximité des hôtels
- **Informations météo** pour aider à la planification du séjour
- **Disponibilité des chambres** mise à jour dynamiquement

### Personnalisation de l'expérience
- Recommandations basées sur les préférences utilisateur
- Système de sauvegarde des recherches récentes
- Options de tri personnalisables pour les résultats d'hôtels

### Fonctionnalités uniques
- Vue comparative des chambres d'hôtel
- Galerie photos immersive avec lightbox personnalisé
- Système d'alerte pour les promotions limitées dans le temps

## 📊 Qualité de code & Bonnes pratiques

Le projet adhère à des standards élevés de qualité de code :

### Organisation et structure
- **Architecture modulaire** séparant clairement les responsabilités
- **Nommage descriptif** des variables, fonctions et classes
- **Commentaires détaillés** expliquant la logique complexe

### Bonnes pratiques de développement
- **Code DRY** (Don't Repeat Yourself) avec factorisation des fonctionnalités communes
- **Séparation des préoccupations** entre HTML (structure), CSS (présentation) et JS (comportement)
- **Gestion des erreurs** avec affichage de messages utilisateur appropriés
- **Versionnement avec Git** pour le suivi des modifications

### Documentation
- README complet expliquant la structure et le fonctionnement du projet
- Documentation des fonctions et API utilisées
- Instructions d'installation et de déploiement claires

## ⚡ Fonctionnalité & Performance

Le projet est optimisé pour offrir des performances optimales :

### Optimisations de chargement
- **Lazy loading** des images pour accélérer le chargement initial
- **Minification** des ressources CSS et JavaScript
- **Mise en cache** des données API pour réduire les requêtes réseau

### Gestion des erreurs
- **Validation client** des formulaires pour éviter les soumissions inutiles
- **Gestion gracieuse** des erreurs API avec affichage de messages explicatifs
- **Fallback** pour les fonctionnalités nécessitant JavaScript désactivé

### Performance perçue
- **Feedback immédiat** lors des actions utilisateur
- **États de chargement** explicites pour les opérations longues
- **Transitions fluides** donnant une impression de rapidité

## 🔧 Installation et déploiement

### Prérequis
- Serveur web (Apache, Nginx) avec PHP 7.4+
- MySQL 5.7+ ou MariaDB 10.2+
- MAMP, XAMPP ou environnement similaire pour le développement local

### Installation locale

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/votre-user/TripISEN.git
   cd TripISEN
   ```

2. **Configuration de la base de données**
   - Créer une base de données MySQL nommée `tripisen`
   - Importer le schéma depuis `/hotel-booking-website/sql/users_tables.sql`
   ```bash
   mysql -u root -p tripisen < hotel-booking-website/sql/users_tables.sql
   ```

3. **Configuration des API**
   - Créer un compte sur [OpenSky Network](https://opensky-network.org/apidoc/) pour l'API de suivi des vols
   - Créer un compte sur [Meteoblue](https://content.meteoblue.com/en/access-options/meteoblue-weather-api) pour l'API météo
   - Configurer les clés API dans `/hotel-booking-website/js/config.js` :
   ```javascript
   const CONFIG = {
     OPENSKY_API: {
       USERNAME: 'votre_username',
       PASSWORD: 'votre_password'
     },
     METEOBLUE_API: {
       KEY: 'votre_cle_api'
     }
   };
   ```

4. **Configuration PHP**
   - Copier `hotel-booking-website/php/config.sample.php` vers `config.php`
   - Modifier les paramètres de connexion à la base de données :
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'tripisen');
   define('DB_USER', 'votre_utilisateur');
   define('DB_PASS', 'votre_mot_de_passe');
   ```

5. **Démarrer le serveur local**
   - Avec MAMP/XAMPP, placer le dossier dans le répertoire `htdocs`
   - Accéder au site via `http://localhost/TripISEN/hotel-booking-website/`
   
## 📄 License

Ce projet est distribué sous licence MIT. Voir le fichier `LICENSE` pour plus d'informations.

---

© 2025 Trip'ISEN. Tous droits réservés.
