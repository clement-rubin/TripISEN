/**
 * Lightbox - Système de galerie d'images en plein écran
 * 
 * Utilisation :
 * 1. Ajoutez la classe 'gallery-image' à toutes les images que vous souhaitez afficher en lightbox
 * 2. Organisez les images dans un conteneur avec la classe 'gallery-container'
 */

document.addEventListener('DOMContentLoaded', function() {
    // Création des éléments de la lightbox s'ils n'existent pas déjà
    if (!document.querySelector('.lightbox')) {
        createLightbox();
    }
    
    // Initialisation de la lightbox
    initLightbox();
});

// Création des éléments HTML de la lightbox
function createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <img src="" alt="Image en plein écran" class="lightbox-image">
            <div class="lightbox-controls">
                <div class="lightbox-prev"><i class="fas fa-chevron-left"></i></div>
                <div class="lightbox-next"><i class="fas fa-chevron-right"></i></div>
            </div>
            <div class="lightbox-caption"></div>
            <div class="lightbox-loader" style="display: none;"></div>
        </div>
        <div class="lightbox-close"><i class="fas fa-times"></i></div>
    `;
    
    document.body.appendChild(lightbox);
}

// Initialisation de la lightbox
function initLightbox() {
    const galleryImages = document.querySelectorAll('.gallery-image');
    const sliderImages = document.querySelectorAll('.slider-image');
    const hotelImages = document.querySelectorAll('.hotel-image');
    
    // Sélectionner toutes les images qui pourraient faire partie d'une galerie
    const allGalleryImages = [...galleryImages, ...sliderImages, ...hotelImages];
    
    // Variables pour stocker l'état de la lightbox
    let currentIndex = 0;
    let images = [];
    
    // Ajouter des écouteurs d'événements à chaque image
    allGalleryImages.forEach((image, index) => {
        // Ajouter un style de curseur pour indiquer que l'image est cliquable
        image.style.cursor = 'pointer';
        
        // Ajouter l'écouteur d'événement click
        image.addEventListener('click', function() {
            // Collecter toutes les images du même groupe
            const container = this.closest('.gallery-container') || 
                             this.closest('.slider') || 
                             this.closest('.hotel-gallery') ||
                             document.body;
            
            images = Array.from(container.querySelectorAll('img')).filter(img => 
                img.classList.contains('gallery-image') || 
                img.classList.contains('slider-image') || 
                img.classList.contains('hotel-image')
            );
            
            // Trouver l'index de l'image cliquée
            currentIndex = images.indexOf(this);
            
            // Ouvrir la lightbox avec l'image cliquée
            openLightbox(this.src, this.alt);
        });
    });
    
    // Fonction pour ouvrir la lightbox
    function openLightbox(src, alt) {
        const lightbox = document.querySelector('.lightbox');
        const lightboxImage = lightbox.querySelector('.lightbox-image');
        const lightboxCaption = lightbox.querySelector('.lightbox-caption');
        const lightboxLoader = lightbox.querySelector('.lightbox-loader');
        
        // Afficher le loader pendant le chargement de l'image
        lightboxLoader.style.display = 'block';
        
        // Définir l'image et la légende
        lightboxImage.src = src;
        lightboxCaption.textContent = alt;
        
        // Cacher l'image jusqu'à ce qu'elle soit chargée
        lightboxImage.style.display = 'none';
        
        // Quand l'image est chargée
        lightboxImage.onload = function() {
            lightboxLoader.style.display = 'none';
            lightboxImage.style.display = 'block';
        };
        
        // Afficher la lightbox
        lightbox.classList.add('active');
        
        // Désactiver le défilement de la page
        document.body.style.overflow = 'hidden';
    }
    
    // Fonction pour naviguer vers l'image précédente
    function prevImage() {
        if (images.length <= 1) return;
        
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        openLightbox(images[currentIndex].src, images[currentIndex].alt);
    }
    
    // Fonction pour naviguer vers l'image suivante
    function nextImage() {
        if (images.length <= 1) return;
        
        currentIndex = (currentIndex + 1) % images.length;
        openLightbox(images[currentIndex].src, images[currentIndex].alt);
    }
    
    // Fonction pour fermer la lightbox
    function closeLightbox() {
        const lightbox = document.querySelector('.lightbox');
        lightbox.classList.remove('active');
        
        // Réactiver le défilement de la page
        document.body.style.overflow = '';
    }
    
    // Ajouter les écouteurs d'événements pour les contrôles de la lightbox
    const lightbox = document.querySelector('.lightbox');
    const prevButton = lightbox.querySelector('.lightbox-prev');
    const nextButton = lightbox.querySelector('.lightbox-next');
    const closeButton = lightbox.querySelector('.lightbox-close');
    
    prevButton.addEventListener('click', prevImage);
    nextButton.addEventListener('click', nextImage);
    closeButton.addEventListener('click', closeLightbox);
    
    // Fermer la lightbox en cliquant en dehors de l'image
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Ajouter la navigation au clavier
    document.addEventListener('keydown', function(e) {
        if (!lightbox.classList.contains('active')) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                prevImage();
                break;
            case 'ArrowRight':
                nextImage();
                break;
            case 'Escape':
                closeLightbox();
                break;
        }
    });
}
