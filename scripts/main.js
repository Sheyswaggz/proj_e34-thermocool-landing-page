/**
 * ThermoCool Landing Page - Main JavaScript
 * 
 * Implements lazy loading, smooth scrolling, and interactive enhancements
 * for optimal performance and user experience.
 * 
 * @generated-from: task-004
 * @modifies: index.html
 * @dependencies: []
 */

(function() {
  'use strict';

  /**
   * Configuration object for application behavior
   */
  const CONFIG = Object.freeze({
    LAZY_LOAD: {
      ROOT_MARGIN: '50px',
      THRESHOLD: 0.01,
      FALLBACK_DELAY: 100
    },
    SMOOTH_SCROLL: {
      BEHAVIOR: 'smooth',
      BLOCK: 'start',
      INLINE: 'nearest'
    },
    PERFORMANCE: {
      DEBOUNCE_DELAY: 150,
      THROTTLE_DELAY: 100
    }
  });

  /**
   * Logger utility for structured logging
   */
  const Logger = {
    _log(level, message, context = {}) {
      if (typeof console === 'undefined') return;
      
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        ...context
      };

      console[level](
        `[${timestamp}] [${level.toUpperCase()}] ${message}`,
        context
      );
    },

    info(message, context) {
      this._log('info', message, context);
    },

    warn(message, context) {
      this._log('warn', message, context);
    },

    error(message, context) {
      this._log('error', message, context);
    }
  };

  /**
   * Lazy loading implementation using Intersection Observer
   * with fallback for older browsers
   */
  class LazyLoader {
    constructor() {
      this.images = [];
      this.observer = null;
      this.initialized = false;
    }

    /**
     * Initialize lazy loading for all images
     */
    init() {
      if (this.initialized) {
        Logger.warn('LazyLoader already initialized');
        return;
      }

      try {
        this.images = Array.from(
          document.querySelectorAll('img[loading="lazy"]')
        );

        if (this.images.length === 0) {
          Logger.info('No lazy-loadable images found');
          return;
        }

        if ('IntersectionObserver' in window) {
          this._initIntersectionObserver();
        } else {
          this._fallbackLoad();
        }

        this.initialized = true;
        Logger.info('LazyLoader initialized', {
          imageCount: this.images.length,
          method: 'IntersectionObserver' in window ? 'observer' : 'fallback'
        });
      } catch (error) {
        Logger.error('Failed to initialize LazyLoader', {
          error: error.message,
          stack: error.stack
        });
        this._fallbackLoad();
      }
    }

    /**
     * Initialize Intersection Observer for modern browsers
     * @private
     */
    _initIntersectionObserver() {
      const options = {
        root: null,
        rootMargin: CONFIG.LAZY_LOAD.ROOT_MARGIN,
        threshold: CONFIG.LAZY_LOAD.THRESHOLD
      };

      this.observer = new IntersectionObserver(
        this._handleIntersection.bind(this),
        options
      );

      this.images.forEach(img => {
        this.observer.observe(img);
      });
    }

    /**
     * Handle intersection events
     * @private
     * @param {IntersectionObserverEntry[]} entries
     */
    _handleIntersection(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this._loadImage(img);
          this.observer.unobserve(img);
        }
      });
    }

    /**
     * Load individual image
     * @private
     * @param {HTMLImageElement} img
     */
    _loadImage(img) {
      const src = img.getAttribute('src');
      
      if (!src) {
        Logger.warn('Image missing src attribute', {
          alt: img.getAttribute('alt')
        });
        return;
      }

      img.addEventListener('load', () => {
        img.classList.add('loaded');
        Logger.info('Image loaded successfully', { src });
      }, { once: true });

      img.addEventListener('error', () => {
        img.classList.add('error');
        Logger.error('Image failed to load', { src });
      }, { once: true });

      if (img.loading !== 'lazy') {
        img.loading = 'lazy';
      }
    }

    /**
     * Fallback loading for browsers without Intersection Observer
     * @private
     */
    _fallbackLoad() {
      Logger.info('Using fallback lazy loading');
      
      setTimeout(() => {
        this.images.forEach(img => {
          this._loadImage(img);
        });
      }, CONFIG.LAZY_LOAD.FALLBACK_DELAY);
    }

    /**
     * Cleanup resources
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      this.images = [];
      this.initialized = false;
      Logger.info('LazyLoader destroyed');
    }
  }

  /**
   * Smooth scrolling implementation for navigation links
   */
  class SmoothScroller {
    constructor() {
      this.links = [];
      this.initialized = false;
    }

    /**
     * Initialize smooth scrolling for anchor links
     */
    init() {
      if (this.initialized) {
        Logger.warn('SmoothScroller already initialized');
        return;
      }

      try {
        this.links = Array.from(
          document.querySelectorAll('a[href^="#"]')
        );

        if (this.links.length === 0) {
          Logger.info('No anchor links found for smooth scrolling');
          return;
        }

        this.links.forEach(link => {
          link.addEventListener('click', this._handleClick.bind(this));
        });

        this.initialized = true;
        Logger.info('SmoothScroller initialized', {
          linkCount: this.links.length
        });
      } catch (error) {
        Logger.error('Failed to initialize SmoothScroller', {
          error: error.message,
          stack: error.stack
        });
      }
    }

    /**
     * Handle click events on anchor links
     * @private
     * @param {Event} event
     */
    _handleClick(event) {
      const href = event.currentTarget.getAttribute('href');
      
      if (!href || href === '#') {
        return;
      }

      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (!targetElement) {
        Logger.warn('Target element not found', { targetId });
        return;
      }

      event.preventDefault();

      try {
        targetElement.scrollIntoView({
          behavior: CONFIG.SMOOTH_SCROLL.BEHAVIOR,
          block: CONFIG.SMOOTH_SCROLL.BLOCK,
          inline: CONFIG.SMOOTH_SCROLL.INLINE
        });

        if (targetElement.hasAttribute('tabindex')) {
          targetElement.focus();
        } else {
          targetElement.setAttribute('tabindex', '-1');
          targetElement.focus();
          targetElement.addEventListener('blur', () => {
            targetElement.removeAttribute('tabindex');
          }, { once: true });
        }

        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', href);
        }

        Logger.info('Smooth scroll completed', { targetId });
      } catch (error) {
        Logger.error('Smooth scroll failed', {
          targetId,
          error: error.message
        });
        targetElement.scrollIntoView();
      }
    }

    /**
     * Cleanup resources
     */
    destroy() {
      this.links.forEach(link => {
        link.removeEventListener('click', this._handleClick);
      });
      this.links = [];
      this.initialized = false;
      Logger.info('SmoothScroller destroyed');
    }
  }

  /**
   * Form validation and enhancement
   */
  class FormEnhancer {
    constructor() {
      this.form = null;
      this.initialized = false;
    }

    /**
     * Initialize form enhancements
     */
    init() {
      if (this.initialized) {
        Logger.warn('FormEnhancer already initialized');
        return;
      }

      try {
        this.form = document.querySelector('.form');

        if (!this.form) {
          Logger.info('No form found for enhancement');
          return;
        }

        this.form.addEventListener('submit', this._handleSubmit.bind(this));

        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          input.addEventListener('invalid', this._handleInvalid.bind(this));
          input.addEventListener('blur', this._handleBlur.bind(this));
        });

        this.initialized = true;
        Logger.info('FormEnhancer initialized');
      } catch (error) {
        Logger.error('Failed to initialize FormEnhancer', {
          error: error.message,
          stack: error.stack
        });
      }
    }

    /**
     * Handle form submission
     * @private
     * @param {Event} event
     */
    _handleSubmit(event) {
      const form = event.target;
      
      if (!form.checkValidity()) {
        event.preventDefault();
        
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) {
          firstInvalid.focus();
        }

        Logger.warn('Form validation failed');
        return;
      }

      Logger.info('Form submitted successfully');
    }

    /**
     * Handle invalid input
     * @private
     * @param {Event} event
     */
    _handleInvalid(event) {
      const input = event.target;
      const errorMessage = input.validationMessage;

      Logger.info('Input validation failed', {
        field: input.name,
        error: errorMessage
      });
    }

    /**
     * Handle input blur for validation
     * @private
     * @param {Event} event
     */
    _handleBlur(event) {
      const input = event.target;
      
      if (input.value && !input.checkValidity()) {
        input.classList.add('invalid');
      } else {
        input.classList.remove('invalid');
      }
    }

    /**
     * Cleanup resources
     */
    destroy() {
      if (this.form) {
        this.form.removeEventListener('submit', this._handleSubmit);
        
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          input.removeEventListener('invalid', this._handleInvalid);
          input.removeEventListener('blur', this._handleBlur);
        });
      }
      
      this.form = null;
      this.initialized = false;
      Logger.info('FormEnhancer destroyed');
    }
  }

  /**
   * Application initialization and lifecycle management
   */
  class App {
    constructor() {
      this.lazyLoader = new LazyLoader();
      this.smoothScroller = new SmoothScroller();
      this.formEnhancer = new FormEnhancer();
      this.initialized = false;
    }

    /**
     * Initialize the application
     */
    init() {
      if (this.initialized) {
        Logger.warn('App already initialized');
        return;
      }

      try {
        Logger.info('Initializing ThermoCool application');

        this.lazyLoader.init();
        this.smoothScroller.init();
        this.formEnhancer.init();

        this.initialized = true;
        Logger.info('ThermoCool application initialized successfully');
      } catch (error) {
        Logger.error('Failed to initialize application', {
          error: error.message,
          stack: error.stack
        });
      }
    }

    /**
     * Cleanup and destroy the application
     */
    destroy() {
      this.lazyLoader.destroy();
      this.smoothScroller.destroy();
      this.formEnhancer.destroy();
      this.initialized = false;
      Logger.info('ThermoCool application destroyed');
    }
  }

  /**
   * Initialize application when DOM is ready
   */
  function initializeApp() {
    const app = new App();
    app.init();

    window.addEventListener('beforeunload', () => {
      app.destroy();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

})();