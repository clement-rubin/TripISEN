/**
 * Gestion de la galerie d'images du chalet complet
 */
document.addEventListener('DOMContentLoaded', function() {
    initEntireChaletGallery();
});

function initEntireChaletGallery() {
    // Éléments de la galerie
    const mainImage = document.getElementById('main-chalet-image');
    const thumbnails = document.querySelectorAll('.chalet-thumbnails img');
    const prevButton = document.getElementById('prev-chalet-image');
    const nextButton = document.getElementById('next-chalet-image');
    const currentCounter = document.getElementById('current-chalet-image');
    const totalCounter = document.getElementById('total-chalet-images');
    
    // Si les éléments n'existent pas, on sort
    if (!mainImage || !thumbnails.length || !prevButton || !nextButton) return;
    
    // État de la galerie
    let currentIndex = 0;
    const totalImages = thumbnails.length;
    
    // Mettre à jour le compteur
    if (currentCounter && totalCounter) {
        totalCounter.textContent = totalImages;
        updateCounter();
    }
    
    // Fonction pour afficher l'image sélectionnée
    function showImage(index) {
        // Vérification des limites
        if (index < 0) index = totalImages - 1;
        if (index >= totalImages) index = 0;
        
        // Mise à jour de l'index courant
        currentIndex = index;
        
        // Mise à jour de l'image principale
        mainImage.src = thumbnails[index].src;
        mainImage.alt = thumbnails[index].alt;
        
        // Mise à jour de la classe active
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[index].classList.add('active');
        
        // Mise à jour du compteur
        updateCounter();
        
        // Faire défiler la miniature active dans la vue
        thumbnails[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    
    // Fonction pour mettre à jour le compteur
    function updateCounter() {
        if (currentCounter) {
            currentCounter.textContent = currentIndex + 1;
        }
    }
    
    // Écouteurs d'événements pour les flèches de navigation
    prevButton.addEventListener('click', () => {
        showImage(currentIndex - 1);
    });
    
    nextButton.addEventListener('click', () => {
        showImage(currentIndex + 1);
    });
    
    // Navigation au clavier quand on est sur la galerie
    mainImage.parentElement.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            showImage(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            showImage(currentIndex + 1);
        }
    });
    
    // Écouteurs d'événements pour les miniatures
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            showImage(index);
        });
    });
    
    // Initialiser la galerie avec la première image
    showImage(0);
}
