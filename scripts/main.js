/**
 * Main JavaScript Module
 * Handles core functionality, form interactions, and performance monitoring
 * 
 * @module main
 * @generated-from: task-006
 * @modifies: scripts/main.js
 */

(function() {
  'use strict';

  // Performance monitoring state
  const performanceMetrics = {
    navigationStart: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    timeToInteractive: 0,
  };

  /**
   * Initialize performance monitoring with Web Vitals API
   */
  function initPerformanceMonitoring() {
    // Store navigation start time
    if (performance.timing) {
      performanceMetrics.navigationStart = performance.timing.navigationStart;
    }

    // Monitor Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          performanceMetrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
          
          // Log LCP metric
          console.log('[Performance] LCP:', performanceMetrics.largestContentfulPaint.toFixed(2), 'ms');
          
          // Check if LCP meets threshold (2.5s)
          if (performanceMetrics.largestContentfulPaint > 2500) {
            console.warn('[Performance] LCP exceeds recommended threshold of 2.5s');
          }
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('[Performance] LCP monitoring not supported:', e);
      }

      // Monitor First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            performanceMetrics.firstInputDelay = entry.processingStart - entry.startTime;
            
            console.log('[Performance] FID:', performanceMetrics.firstInputDelay.toFixed(2), 'ms');
            
            // Check if FID meets threshold (100ms)
            if (performanceMetrics.firstInputDelay > 100) {
              console.warn('[Performance] FID exceeds recommended threshold of 100ms');
            }
          });
        });
        
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.warn('[Performance] FID monitoring not supported:', e);
      }

      // Monitor Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              performanceMetrics.cumulativeLayoutShift = clsValue;
            }
          });
          
          console.log('[Performance] CLS:', performanceMetrics.cumulativeLayoutShift.toFixed(3));
          
          // Check if CLS meets threshold (0.1)
          if (performanceMetrics.cumulativeLayoutShift > 0.1) {
            console.warn('[Performance] CLS exceeds recommended threshold of 0.1');
          }
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('[Performance] CLS monitoring not supported:', e);
      }

      // Monitor First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              performanceMetrics.firstContentfulPaint = entry.startTime;
              console.log('[Performance] FCP:', performanceMetrics.firstContentfulPaint.toFixed(2), 'ms');
            }
          });
        });
        
        fcpObserver.observe({ type: 'paint', buffered: true });
      } catch (e) {
        console.warn('[Performance] FCP monitoring not supported:', e);
      }
    }

    // Monitor page load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log('[Performance] Page Load Time:', loadTime.toFixed(2), 'ms');
        
        // Check if load time meets threshold (3s)
        if (loadTime > 3000) {
          console.warn('[Performance] Page load time exceeds recommended threshold of 3s');
        }

        // Log complete performance summary
        logPerformanceSummary();
      }, 0);
    });
  }

  /**
   * Log comprehensive performance summary
   */
  function logPerformanceSummary() {
    console.group('[Performance] Summary');
    console.log('Navigation Start:', performanceMetrics.navigationStart);
    console.log('First Contentful Paint:', performanceMetrics.firstContentfulPaint.toFixed(2), 'ms');
    console.log('Largest Contentful Paint:', performanceMetrics.largestContentfulPaint.toFixed(2), 'ms');
    console.log('First Input Delay:', performanceMetrics.firstInputDelay.toFixed(2), 'ms');
    console.log('Cumulative Layout Shift:', performanceMetrics.cumulativeLayoutShift.toFixed(3));
    
    // Calculate and log additional metrics
    if (performance.timing) {
      const timing = performance.timing;
      console.log('DNS Lookup:', (timing.domainLookupEnd - timing.domainLookupStart).toFixed(2), 'ms');
      console.log('TCP Connection:', (timing.connectEnd - timing.connectStart).toFixed(2), 'ms');
      console.log('Request Time:', (timing.responseStart - timing.requestStart).toFixed(2), 'ms');
      console.log('Response Time:', (timing.responseEnd - timing.responseStart).toFixed(2), 'ms');
      console.log('DOM Processing:', (timing.domComplete - timing.domLoading).toFixed(2), 'ms');
    }
    
    console.groupEnd();
  }

  /**
   * Enhanced lazy loading for images with intersection observer
   */
  function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      console.warn('[Performance] IntersectionObserver not supported, loading all images');
      return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Load image
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // Load srcset if present
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          // Mark as loaded
          img.classList.add('loaded');
          
          // Stop observing this image
          observer.unobserve(img);
          
          console.log('[Performance] Lazy loaded image:', img.alt || img.src);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
    });

    // Observe all images with loading="lazy"
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach((img) => {
      imageObserver.observe(img);
    });
  }

  /**
   * Monitor resource loading performance
   */
  function monitorResourceLoading() {
    if (!performance.getEntriesByType) {
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource');
        
        console.group('[Performance] Resource Loading');
        
        // Categorize resources
        const resourcesByType = {
          image: [],
          script: [],
          stylesheet: [],
          other: [],
        };
        
        resources.forEach((resource) => {
          const type = resource.initiatorType;
          if (type === 'img') {
            resourcesByType.image.push(resource);
          } else if (type === 'script') {
            resourcesByType.script.push(resource);
          } else if (type === 'link' || type === 'css') {
            resourcesByType.stylesheet.push(resource);
          } else {
            resourcesByType.other.push(resource);
          }
        });
        
        // Log statistics for each type
        Object.keys(resourcesByType).forEach((type) => {
          const items = resourcesByType[type];
          if (items.length > 0) {
            const totalSize = items.reduce((sum, item) => sum + (item.transferSize || 0), 0);
            const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);
            const avgDuration = totalDuration / items.length;
            
            console.log(`${type}:`, {
              count: items.length,
              totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
              avgDuration: `${avgDuration.toFixed(2)} ms`,
            });
          }
        });
        
        console.groupEnd();
      }, 0);
    });
  }

  /**
   * Track Core Web Vitals and send to analytics (placeholder)
   */
  function trackWebVitals() {
    // This is a placeholder for analytics integration
    // In production, you would send these metrics to your analytics service
    
    const sendToAnalytics = (metric) => {
      console.log('[Analytics] Web Vital:', metric);
      
      // Example: Send to Google Analytics
      // if (window.gtag) {
      //   gtag('event', metric.name, {
      //     value: Math.round(metric.value),
      //     metric_id: metric.id,
      //     metric_value: metric.value,
      //     metric_delta: metric.delta,
      //   });
      // }
    };

    // Track when metrics are available
    if ('PerformanceObserver' in window) {
      // LCP tracking
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          sendToAnalytics({
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            id: 'lcp-' + Date.now(),
            delta: lastEntry.renderTime || lastEntry.loadTime,
          });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // Observer not supported
      }

      // FID tracking
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            sendToAnalytics({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              id: 'fid-' + Date.now(),
              delta: entry.processingStart - entry.startTime,
            });
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // Observer not supported
      }
    }
  }

  /**
   * Initialize smooth scrolling for anchor links
   */
  function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Skip if href is just "#"
        if (href === '#') {
          return;
        }
        
        const target = document.querySelector(href);
        
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
          
          // Update URL without triggering scroll
          if (history.pushState) {
            history.pushState(null, null, href);
          }
        }
      });
    });
  }

  /**
   * Initialize form validation and handling
   */
  function initFormHandling() {
    const form = document.querySelector('.contact__form form');
    
    if (!form) {
      return;
    }

    // Check if FormValidation module is available
    if (typeof window.FormValidation === 'undefined') {
      console.warn('[Form] FormValidation module not loaded');
      return;
    }

    const { validateForm, validateField } = window.FormValidation;

    // Real-time validation on blur
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      input.addEventListener('blur', () => {
        const result = validateField(input.name, input.value);
        displayFieldError(input, result);
      });

      // Clear error on focus
      input.addEventListener('focus', () => {
        clearFieldError(input);
      });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Collect form data
      const formData = {};
      inputs.forEach((input) => {
        formData[input.name] = input.value;
      });

      // Validate entire form
      const validation = validateForm(formData);

      if (!validation.valid) {
        // Display all errors
        validation.errors.forEach((error, fieldName) => {
          const input = form.querySelector(`[name="${fieldName}"]`);
          if (input) {
            displayFieldError(input, { valid: false, error });
          }
        });

        // Focus first invalid field
        const firstError = form.querySelector('.form__group--error');
        if (firstError) {
          const input = firstError.querySelector('input, select, textarea');
          if (input) {
            input.focus();
          }
        }

        return;
      }

      // Form is valid - submit
      console.log('[Form] Submitting form with data:', validation.sanitizedData);
      
      // In production, you would send this to your backend
      // For now, just show success message
      showFormSuccess();
    });
  }

  /**
   * Display field validation error
   */
  function displayFieldError(input, result) {
    const formGroup = input.closest('.form__group');
    
    if (!formGroup) {
      return;
    }

    // Remove existing error
    clearFieldError(input);

    if (!result.valid && result.error) {
      formGroup.classList.add('form__group--error');
      
      const errorElement = document.createElement('span');
      errorElement.className = 'form__error';
      errorElement.textContent = result.error;
      errorElement.setAttribute('role', 'alert');
      
      formGroup.appendChild(errorElement);
      input.setAttribute('aria-invalid', 'true');
    }
  }

  /**
   * Clear field validation error
   */
  function clearFieldError(input) {
    const formGroup = input.closest('.form__group');
    
    if (!formGroup) {
      return;
    }

    formGroup.classList.remove('form__group--error');
    
    const errorElement = formGroup.querySelector('.form__error');
    if (errorElement) {
      errorElement.remove();
    }
    
    input.removeAttribute('aria-invalid');
  }

  /**
   * Show form success message
   */
  function showFormSuccess() {
    const form = document.querySelector('.contact__form form');
    
    if (!form) {
      return;
    }

    // Create success message
    const successMessage = document.createElement('div');
    successMessage.className = 'form__success';
    successMessage.setAttribute('role', 'alert');
    successMessage.innerHTML = `
      <p><strong>Thank you for your message!</strong></p>
      <p>We'll get back to you as soon as possible.</p>
    `;

    // Replace form with success message
    form.style.display = 'none';
    form.parentNode.insertBefore(successMessage, form);

    // Reset form
    form.reset();
  }

  /**
   * Initialize all functionality when DOM is ready
   */
  function init() {
    console.log('[Main] Initializing ThermoCool landing page');
    
    // Initialize performance monitoring first
    initPerformanceMonitoring();
    
    // Initialize lazy loading
    initLazyLoading();
    
    // Monitor resource loading
    monitorResourceLoading();
    
    // Track Web Vitals
    trackWebVitals();
    
    // Initialize smooth scrolling
    initSmoothScrolling();
    
    // Initialize form handling
    initFormHandling();
    
    console.log('[Main] Initialization complete');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for testing purposes
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initPerformanceMonitoring,
      initLazyLoading,
      monitorResourceLoading,
      trackWebVitals,
      performanceMetrics,
    };
  }

})();