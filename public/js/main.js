// RushidaLanka Hardware Shop - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme
  initTheme();

  // Initialize theme toggle
  initThemeToggle();

  // Initialize form validation
  initFormValidation();

  // Initialize smooth scrolling
  initSmoothScrolling();

  // Initialize animations
  initAnimations();

  // Initialize scroll effects
  initScrollEffects();

  // Initialize product interactions
  initProductInteractions();

  // Initialize page transitions
  initPageTransitions();

  // Initialize typing animation
  initTypingAnimation();

  // Initialize video playlist
  initVideoPlaylist();

  // Load dynamic content
  loadTestimonials();
  loadProducts();

  // Initialize logout functionality
  initLogout();
});

// Theme management functions
function initTheme() {
  // Check for saved theme preference or default to light mode
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark-theme', savedTheme === 'dark');
}

function initThemeToggle() {
  // Theme toggle functionality (placeholder - implement as needed)
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const isDark = document.body.classList.toggle('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
}

// Form validation
function initFormValidation() {
  // Basic form validation (placeholder - implement as needed)
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      // Add validation logic here if needed
    });
  });
}

// Smooth scrolling
function initSmoothScrolling() {
  // Smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Animations
function initAnimations() {
  // Initialize scroll-triggered animations using Intersection Observer
  observeElements();
}

// Intersection Observer for scroll animations
function observeElements() {
  const observerOptions = {
    threshold: 0.05,
    rootMargin: '0px 0px -50px 0px' // Trigger 50px before element enters
  };

  // Observe all sections for smooth fade-in-up animations
  const sections = document.querySelectorAll('section');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        if (!element.classList.contains('hero-section') && !element.classList.contains('animate-on-scroll')) {
          // Default animation for all sections is slide-in-up
          element.classList.add('animate-on-scroll', 'animate-slide-in-up');
          sectionObserver.unobserve(element);
        }
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    sectionObserver.observe(section);
  });

  // Observe individual cards and elements for staggered slide-in-up animations
  const elements = document.querySelectorAll('.card, .product-card, .feature-icon, .row > [class*="col"]:not(.hero-section)');
  const elementObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        if (!element.classList.contains('animate-on-scroll')) {
          // Calculate position-based delay for cascade effect
          const rect = element.getBoundingClientRect();
          const parentRect = element.parentElement.getBoundingClientRect();
          const positionInParent = (rect.top - parentRect.top) / parentRect.height;
          
          const delayClass = `animate-delay-${Math.min(Math.floor(positionInParent * 4) + 1, 4)}`;
          
          // Use smooth slide-in-up with staggered delay
          element.classList.add('animate-on-scroll', 'animate-slide-in-up-smooth', delayClass);
          elementObserver.unobserve(element);
        }
      }
    });
  }, observerOptions);

  elements.forEach(element => {
    elementObserver.observe(element);
  });

  // Observe text elements and headings for fade-in
  const textElements = document.querySelectorAll('.section-title, h1, h2, h3, h4, h5, .lead, p');
  const textObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const parent = element.closest('section');
        
        // Skip if already animated or if in hero section
        if (!element.classList.contains('animate-on-scroll') && 
            parent && !parent.classList.contains('hero-section') &&
            element.offsetHeight > 0) {
          
          // Text elements get fade-in-up with shorter distance
          element.classList.add('animate-on-scroll', 'animate-slide-in-up-smooth');
          textObserver.unobserve(element);
        }
      }
    });
  }, observerOptions);

  textElements.forEach(element => {
    textObserver.observe(element);
  });
}

// Scroll effects on navbar
function initScrollEffects() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Animated counter for statistics
  const counters = document.querySelectorAll('.stats-number');
  let animationTriggered = false;

  window.addEventListener('scroll', () => {
    if (animationTriggered) return;

    counters.forEach(counter => {
      const rect = counter.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom >= 0 && !animationTriggered) {
        animateCounters();
        animationTriggered = true;
      }
    });
  });
}

// Animate counter numbers
function animateCounters() {
  const counters = document.querySelectorAll('.stats-number');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    let current = 0;
    const increment = target / 50;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        counter.textContent = target;
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(current);
      }
    }, 30);
  });
}

// Product interactions
function initProductInteractions() {
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-15px) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Add rating system to product cards if needed
  initProductRatings();
}

// Dynamic content loading
function loadTestimonials() {
  // Load testimonials dynamically (placeholder - implement as needed)
}

function loadProducts() {
  // Load products dynamically (placeholder - implement as needed)
}

// Logout functionality
function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        // Add a small delay to show the confirmation
        showLoadingOverlay();
        setTimeout(() => {
          window.location.href = this.getAttribute('href');
        }, 300);
      }
    });
  }
}

// Page Transitions System
function initPageTransitions() {
  // Add transition class to body
  document.body.classList.add('page-transition');

  // Initialize page content wrapper
  const pageContent = document.querySelector('.container-fluid') || document.body;
  pageContent.classList.add('page-content');

  // Handle navigation clicks
  initNavigationTransitions();

  // Handle browser back/forward
  initHistoryTransitions();

  // Initial page enter animation
  setTimeout(() => {
    document.body.classList.add('page-enter');
  }, 100);
}

function initNavigationTransitions() {
  const navLinks = document.querySelectorAll('a[href]');
  const isAdminRoute = window.location.pathname.startsWith('/admin/');

  navLinks.forEach(link => {
    // Skip external links, anchors, and admin links
    if (link.href.startsWith('http') && !link.href.includes(window.location.origin)) return;
    if (link.href.includes('#')) return;
    
    // Skip admin navigation handling for admin routes
    if (isAdminRoute) {
      // Update active states for admin nav
      if (link.pathname === window.location.pathname) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
      return;
    }

    // Only add transition for non-admin links
    if (!link.href.includes('/admin/')) {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skip if same page or external
        if (href === window.location.pathname || href.startsWith('http')) return;

        e.preventDefault();
        startPageTransition(href);
      });
    }
  });
}

function initHistoryTransitions() {
  window.addEventListener('popstate', function(e) {
    // Handle browser back/forward with transition
    startPageTransition(window.location.pathname, false);
  });
}

function startPageTransition(targetUrl, pushState = true) {
  // Show loading overlay
  showLoadingOverlay();

  // Start exit animation
  document.body.classList.remove('page-enter');
  document.body.classList.add('page-exit');

  setTimeout(() => {
    if (pushState) {
      // Navigate to new page
      window.location.href = targetUrl;
    }
  }, 300); // Match transition duration
}

function showLoadingOverlay() {
  // Create loading overlay if it doesn't exist
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading...</div>
    `;
    document.body.appendChild(overlay);
  }

  // Check for dark theme
  if (document.body.classList.contains('dark-theme')) {
    overlay.classList.add('dark-theme');
  }

  overlay.classList.add('show');
}

function hideLoadingOverlay() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
}

// Enhanced navigation with transition effects
function initEnhancedNavigation() {
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  navLinks.forEach(link => {
    link.classList.add('nav-link-transition');
  });
}

// Product ratings system
function initProductRatings() {
  // Placeholder for product rating functionality
  // Can be expanded to include 5-star rating system
}

// Enhanced form interactions
function enhanceFormInteractions() {
  const formInputs = document.querySelectorAll('.form-control, .form-select');
  
  formInputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });

    // Add floating label effect if needed
    input.addEventListener('input', function() {
      if (this.value.trim()) {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    });
  });
}

// Typing Animation Function
function initTypingAnimation() {
  const typingText = document.getElementById('typingText');
  if (!typingText) return;

  const lines = [
    '🔧 Welcome to FushidaLanka',
    'Premium Tools & Materials',
    'Expert Service & Support',
    'Quality Guaranteed Since 2010'
  ];

  let lineIndex = 0;
  let charIndex = 0;
  let currentText = '';
  let isDeleting = false;
  let isWaitingBeforeDelete = false;
  const typingSpeed = 60;
  const deletingSpeed = 40;
  const pauseDuration = 2000;

  function typeNextChar() {
    const currentLine = lines[lineIndex];

    if (!isDeleting && !isWaitingBeforeDelete) {
      // Typing mode
      if (charIndex < currentLine.length) {
        currentText += currentLine[charIndex];
        charIndex++;
        typingText.textContent = currentText;
        setTimeout(typeNextChar, typingSpeed);
      } else {
        // Wait before deleting
        isWaitingBeforeDelete = true;
        setTimeout(typeNextChar, pauseDuration);
      }
    } else if (isWaitingBeforeDelete) {
      // Transition to deleting
      isWaitingBeforeDelete = false;
      isDeleting = true;
      setTimeout(typeNextChar, 500);
    } else if (isDeleting) {
      // Deleting mode
      if (charIndex > 0) {
        currentText = currentLine.substring(0, charIndex - 1);
        charIndex--;
        typingText.textContent = currentText;
        setTimeout(typeNextChar, deletingSpeed);
      } else {
        // Move to next line
        isDeleting = false;
        lineIndex = (lineIndex + 1) % lines.length;
        charIndex = 0;
        currentText = '';
        setTimeout(typeNextChar, 500);
      }
    }
  }

  // Start typing animation
  typeNextChar();
}

// Video Playlist Function
function initVideoPlaylist() {
  const videoElement = document.getElementById('heroVideo');
  if (!videoElement) return;

  // Array of video sources to play sequentially
  const videoPlaylist = [
    '/images/vdo123.mp4',
    '/images/vdo1234.mp4'
  ];

  let currentVideoIndex = 0;

  // Function to play the next video
  function playNextVideo() {
    if (currentVideoIndex >= videoPlaylist.length) {
      // Loop back to the beginning
      currentVideoIndex = 0;
    }

    // Set the video source
    videoElement.src = videoPlaylist[currentVideoIndex];
    videoElement.load();
    videoElement.play().catch(error => {
      console.log('Video playback error:', error);
    });

    // Move to next video on the playlist
    currentVideoIndex++;
  }

  // Start playing the first video
  playNextVideo();

  // When the current video ends, play the next one
  videoElement.addEventListener('ended', function() {
    playNextVideo();
  });

  // Make sure video continues playing if it can
  videoElement.addEventListener('canplay', function() {
    videoElement.play().catch(error => {
      console.log('Autoplay prevented:', error);
    });
  });
}

// Admin sidebar mobile toggle
function initAdminMobileMenu() {
  const toggleBtn = document.getElementById('adminMenuToggle');
  const sidebar = document.querySelector('.admin-sidebar');
  const body = document.body;
  
  if (toggleBtn && sidebar) {
    // Toggle sidebar on button click
    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      sidebar.classList.toggle('show');
    });
    
    // Close sidebar when a link is clicked
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', function() {
        // Close sidebar on mobile/tablet
        if (window.innerWidth <= 991.98) {
          sidebar.classList.remove('show');
        }
      });
    });
    
    // Close sidebar when clicking outside of it
    document.addEventListener('click', function(e) {
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        if (window.innerWidth <= 991.98) {
          sidebar.classList.remove('show');
        }
      }
    });
    
    // Close sidebar on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && window.innerWidth <= 991.98) {
        sidebar.classList.remove('show');
      }
    });
  }
}

// Initialize on page load
window.addEventListener('load', () => {
  enhanceFormInteractions();
  // Trigger any animations that might be missed
  observeElements();
  // Initialize admin menu toggle if on admin page
  initAdminMobileMenu();
});
