/**
 * Configuration globale de l'application
 */
const config = {
    opensky: {
        username: '', // Laissez vide pour utiliser l'API anonyme
        password: ''  // Laissez vide pour utiliser l'API anonyme
    },
    refreshInterval: 60000, // Rafraîchir les données toutes les 60 secondes
    mapDefaultView: [48.8566, 2.3522], // Paris
    mapDefaultZoom: 5
};

// Si configuré en modules ES6
export default config;

// Pour compatibilité avec les scripts non-modules
if (typeof window !== 'undefined') {
    window.config = config;
}
