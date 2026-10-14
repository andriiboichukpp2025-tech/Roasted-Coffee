document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reviewsSection = document.querySelector('#reviews');
  const reviewsSlider = reviewsSection?.querySelector('.reviews-swiper');
  if (reviewsSlider) {
    if (typeof Swiper !== 'undefined') {
      new Swiper(reviewsSlider, {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: true,
        autoplay: reducedMotion ? false : {
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        pagination: {
          el: reviewsSection.querySelector('.swiper-pagination'),
          clickable: true,
          renderBullet: (index, className) => `<button class="${className}" type="button" aria-label="Go to review ${index + 1}"></button>`,
        },
        navigation: {
          nextEl: reviewsSection.querySelector('.swiper-button-next'),
          prevEl: reviewsSection.querySelector('.swiper-button-prev'),
        },
        breakpoints: {
          320: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
        keyboard: { enabled: true },
        grabCursor: true,
        a11y: {
          enabled: true,
          prevSlideMessage: 'Previous review',
          nextSlideMessage: 'Next review',
          paginationBulletMessage: 'Go to review {{index}}',
        },
      });
    } else {
      console.warn('Swiper is unavailable; customer reviews are shown without slider controls.');
    }
  }

  const gallery = document.querySelector('[data-fancybox="coffee-gallery"]');
  if (gallery) {
    if (typeof Fancybox !== 'undefined') {
      Fancybox.bind('[data-fancybox="coffee-gallery"]', {
        Carousel: { transition: 'fade' },
        Images: {
          zoom: true,
          Panzoom: { maxScale: 3 },
        },
        Thumbs: { showOnStart: true },
      });
    } else {
      console.warn('Fancybox is unavailable; the coffee gallery will open images directly.');
    }
  }

  const typedTarget = document.querySelector('#typed-text');
  if (typedTarget) {
    if (reducedMotion) {
      typedTarget.textContent = 'Freshly roasted to order';
    } else if (typeof Typed !== 'undefined') {
      new Typed(typedTarget, {
        strings: ['Freshly roasted to order', 'Specialty Coffee', 'Your coffee, your way.'],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 1500,
        loop: true,
      });
    } else {
      console.warn('Typed.js is unavailable; the static hero text is shown.');
    }
  }
});
