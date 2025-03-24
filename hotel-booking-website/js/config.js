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
    mapDefaultZoom: 5,
    
    hotels: {
        'hotel1': {
            name: 'Hôtel Luxe Paris',
            airports: ['LFPG', 'LFPO'],
            location: {
                lat: 48.8566,
                lng: 2.3522
            }
        },
        'hotel2': {
            name: 'Resort Méditerranée',
            airports: ['LFMN'],
            location: {
                lat: 43.7102,
                lng: 7.2620
            }
        },
        'hotel3': {
            name: 'Chalet Alpin',
            airports: ['LFLP', 'LFLL'],
            location: {
                lat: 45.8992,
                lng: 6.1294
            }
        }
    }
};

// Si configuré en modules ES6
export default config;

// Pour compatibilité avec les scripts non-modules
if (typeof window !== 'undefined') {
    window.config = config;
}
