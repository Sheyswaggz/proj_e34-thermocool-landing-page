/**
 * Performance Monitoring and Optimization Module
 * Provides comprehensive performance measurement, Core Web Vitals tracking,
 * resource loading optimization, and performance reporting utilities
 * 
 * @module performance
 * @generated-from: task-006
 * @modifies: scripts/performance.js
 */

(function() {
  'use strict';

  // Performance metrics storage
  const metrics = {
    navigation: {
      start: 0,
      domContentLoaded: 0,
      loadComplete: 0,
      firstByte: 0,
    },
    paint: {
      firstPaint: 0,
      firstContentfulPaint: 0,
    },
    vitals: {
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      timeToInteractive: 0,
    },
    resources: {
      images: [],
      scripts: [],
      stylesheets: [],
      other: [],
    },
    custom: new Map(),
  };

  // Performance thresholds (in milliseconds, except CLS)
  const THRESHOLDS = Object.freeze({
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
    TTI: { good: 3800, needsImprovement: 7300 },
  });

  // Observer instances for cleanup
  const observers = {
    lcp: null,
    fid: null,
    cls: null,
    paint: null,
    resource: null,
  };

  /**
   * Initialize all performance monitoring
   * @returns {void}
   */
  function initPerformanceMonitoring() {
    if (!supportsPerformanceAPI()) {
      console.warn('[Performance] Performance API not fully supported');
      return;
    }

    captureNavigationTiming();
    observePaintMetrics();
    observeLargestContentfulPaint();
    observeFirstInputDelay();
    observeCumulativeLayoutShift();
    observeResourceTiming();
    calculateTimeToInteractive();

    // Log summary when page is fully loaded
    if (document.readyState === 'complete') {
      logPerformanceSummary();
    } else {
      window.addEventListener('load', () => {
        setTimeout(logPerformanceSummary, 0);
      });
    }

    console.log('[Performance] Monitoring initialized');
  }

  /**
   * Check if Performance API is supported
   * @returns {boolean}
   */
  function supportsPerformanceAPI() {
    return !!(
      window.performance &&
      performance.timing &&
      performance.getEntriesByType
    );
  }

  /**
   * Capture navigation timing metrics
   * @returns {void}
   */
  function captureNavigationTiming() {
    if (!performance.timing) {
      return;
    }

    const timing = performance.timing;
    metrics.navigation.start = timing.navigationStart;
    metrics.navigation.firstByte = timing.responseStart - timing.requestStart;

    // Calculate metrics when available
    const calculateMetrics = () => {
      if (timing.domContentLoadedEventEnd > 0) {
        metrics.navigation.domContentLoaded = 
          timing.domContentLoadedEventEnd - timing.navigationStart;
      }

      if (timing.loadEventEnd > 0) {
        metrics.navigation.loadComplete = 
          timing.loadEventEnd - timing.navigationStart;
      }
    };

    if (document.readyState === 'complete') {
      calculateMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(calculateMetrics, 0);
      });
    }
  }

  /**
   * Observe paint timing metrics
   * @returns {void}
   */
  function observePaintMetrics() {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      observers.paint = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach((entry) => {
          if (entry.name === 'first-paint') {
            metrics.paint.firstPaint = entry.startTime;
            logMetric('First Paint', entry.startTime, 'ms');
          } else if (entry.name === 'first-contentful-paint') {
            metrics.paint.firstContentfulPaint = entry.startTime;
            logMetric('First Contentful Paint', entry.startTime, 'ms', 
              getMetricRating(entry.startTime, THRESHOLDS.FCP));
          }
        });
      });

      observers.paint.observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.warn('[Performance] Paint timing observation failed:', error.message);
    }
  }

  /**
   * Observe Largest Contentful Paint
   * @returns {void}
   */
  function observeLargestContentfulPaint() {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      observers.lcp = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        metrics.vitals.largestContentfulPaint = 
          lastEntry.renderTime || lastEntry.loadTime;

        const rating = getMetricRating(
          metrics.vitals.largestContentfulPaint,
          THRESHOLDS.LCP
        );

        logMetric('Largest Contentful Paint', 
          metrics.vitals.largestContentfulPaint, 'ms', rating);

        if (rating === 'poor') {
          console.warn('[Performance] LCP exceeds recommended threshold');
          logLCPDetails(lastEntry);
        }
      });

      observers.lcp.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('[Performance] LCP observation failed:', error.message);
    }
  }

  /**
   * Log LCP element details for debugging
   * @param {PerformanceEntry} entry - LCP entry
   * @returns {void}
   */
  function logLCPDetails(entry) {
    console.group('[Performance] LCP Element Details');
    console.log('Element:', entry.element);
    console.log('Size:', entry.size);
    console.log('Load Time:', entry.loadTime);
    console.log('Render Time:', entry.renderTime);
    console.log('URL:', entry.url || 'N/A');
    console.groupEnd();
  }

  /**
   * Observe First Input Delay
   * @returns {void}
   */
  function observeFirstInputDelay() {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      observers.fid = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach((entry) => {
          metrics.vitals.firstInputDelay = 
            entry.processingStart - entry.startTime;

          const rating = getMetricRating(
            metrics.vitals.firstInputDelay,
            THRESHOLDS.FID
          );

          logMetric('First Input Delay', 
            metrics.vitals.firstInputDelay, 'ms', rating);

          if (rating === 'poor') {
            console.warn('[Performance] FID exceeds recommended threshold');
            logFIDDetails(entry);
          }
        });
      });

      observers.fid.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.warn('[Performance] FID observation failed:', error.message);
    }
  }

  /**
   * Log FID event details for debugging
   * @param {PerformanceEntry} entry - FID entry
   * @returns {void}
   */
  function logFIDDetails(entry) {
    console.group('[Performance] FID Event Details');
    console.log('Event Type:', entry.name);
    console.log('Start Time:', entry.startTime);
    console.log('Processing Start:', entry.processingStart);
    console.log('Duration:', entry.duration);
    console.groupEnd();
  }

  /**
   * Observe Cumulative Layout Shift
   * @returns {void}
   */
  function observeCumulativeLayoutShift() {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    let clsValue = 0;
    const clsEntries = [];

    try {
      observers.cls = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
            metrics.vitals.cumulativeLayoutShift = clsValue;
          }
        });

        const rating = getMetricRating(clsValue, THRESHOLDS.CLS);
        logMetric('Cumulative Layout Shift', clsValue, '', rating);

        if (rating === 'poor' && clsEntries.length > 0) {
          console.warn('[Performance] CLS exceeds recommended threshold');
          logCLSDetails(clsEntries);
        }
      });

      observers.cls.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('[Performance] CLS observation failed:', error.message);
    }
  }

  /**
   * Log CLS shift details for debugging
   * @param {Array<PerformanceEntry>} entries - CLS entries
   * @returns {void}
   */
  function logCLSDetails(entries) {
    console.group('[Performance] Layout Shift Details');
    console.log('Total Shifts:', entries.length);
    console.log('Top 5 Shifts:');
    
    entries
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .forEach((entry, index) => {
        console.log(`${index + 1}.`, {
          value: entry.value.toFixed(4),
          time: entry.startTime.toFixed(2),
          sources: entry.sources?.map(s => s.node) || [],
        });
      });
    
    console.groupEnd();
  }

  /**
   * Observe resource timing
   * @returns {void}
   */
  function observeResourceTiming() {
    if (!performance.getEntriesByType) {
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource');
        
        resources.forEach((resource) => {
          categorizeResource(resource);
        });

        logResourceSummary();
      }, 0);
    });

    // Observe new resources
    if ('PerformanceObserver' in window) {
      try {
        observers.resource = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((resource) => {
            categorizeResource(resource);
          });
        });

        observers.resource.observe({ type: 'resource', buffered: true });
      } catch (error) {
        console.warn('[Performance] Resource observation failed:', error.message);
      }
    }
  }

  /**
   * Categorize resource by type
   * @param {PerformanceResourceTiming} resource - Resource entry
   * @returns {void}
   */
  function categorizeResource(resource) {
    const type = resource.initiatorType;
    const resourceData = {
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
    };

    if (type === 'img') {
      metrics.resources.images.push(resourceData);
    } else if (type === 'script') {
      metrics.resources.scripts.push(resourceData);
    } else if (type === 'link' || type === 'css') {
      metrics.resources.stylesheets.push(resourceData);
    } else {
      metrics.resources.other.push(resourceData);
    }
  }

  /**
   * Calculate Time to Interactive (approximation)
   * @returns {void}
   */
  function calculateTimeToInteractive() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (!performance.timing) {
          return;
        }

        const timing = performance.timing;
        const tti = timing.domInteractive - timing.navigationStart;
        metrics.vitals.timeToInteractive = tti;

        const rating = getMetricRating(tti, THRESHOLDS.TTI);
        logMetric('Time to Interactive', tti, 'ms', rating);
      }, 0);
    });
  }

  /**
   * Get metric rating based on thresholds
   * @param {number} value - Metric value
   * @param {Object} threshold - Threshold object
   * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
   */
  function getMetricRating(value, threshold) {
    if (value <= threshold.good) {
      return 'good';
    }
    if (value <= threshold.needsImprovement) {
      return 'needs-improvement';
    }
    return 'poor';
  }

  /**
   * Log individual metric with rating
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {string} unit - Unit of measurement
   * @param {string} [rating] - Optional rating
   * @returns {void}
   */
  function logMetric(name, value, unit, rating) {
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
    const ratingEmoji = rating ? getRatingEmoji(rating) : '';
    
    console.log(
      `[Performance] ${name}: ${formattedValue}${unit} ${ratingEmoji}`
    );
  }

  /**
   * Get emoji for rating
   * @param {string} rating - Rating string
   * @returns {string} Emoji
   */
  function getRatingEmoji(rating) {
    const emojis = {
      'good': '✅',
      'needs-improvement': '⚠️',
      'poor': '❌',
    };
    return emojis[rating] || '';
  }

  /**
   * Log comprehensive performance summary
   * @returns {void}
   */
  function logPerformanceSummary() {
    console.group('[Performance] Complete Summary');
    
    // Navigation metrics
    console.group('Navigation Timing');
    console.log('Time to First Byte:', metrics.navigation.firstByte.toFixed(2), 'ms');
    console.log('DOM Content Loaded:', metrics.navigation.domContentLoaded.toFixed(2), 'ms');
    console.log('Page Load Complete:', metrics.navigation.loadComplete.toFixed(2), 'ms');
    console.groupEnd();

    // Paint metrics
    console.group('Paint Metrics');
    console.log('First Paint:', metrics.paint.firstPaint.toFixed(2), 'ms');
    console.log('First Contentful Paint:', metrics.paint.firstContentfulPaint.toFixed(2), 'ms');
    console.groupEnd();

    // Core Web Vitals
    console.group('Core Web Vitals');
    console.log('LCP:', metrics.vitals.largestContentfulPaint.toFixed(2), 'ms',
      getRatingEmoji(getMetricRating(metrics.vitals.largestContentfulPaint, THRESHOLDS.LCP)));
    console.log('FID:', metrics.vitals.firstInputDelay.toFixed(2), 'ms',
      getRatingEmoji(getMetricRating(metrics.vitals.firstInputDelay, THRESHOLDS.FID)));
    console.log('CLS:', metrics.vitals.cumulativeLayoutShift.toFixed(3),
      getRatingEmoji(getMetricRating(metrics.vitals.cumulativeLayoutShift, THRESHOLDS.CLS)));
    console.log('TTI:', metrics.vitals.timeToInteractive.toFixed(2), 'ms',
      getRatingEmoji(getMetricRating(metrics.vitals.timeToInteractive, THRESHOLDS.TTI)));
    console.groupEnd();

    // Detailed timing breakdown
    if (performance.timing) {
      logDetailedTiming();
    }

    console.groupEnd();
  }

  /**
   * Log detailed timing breakdown
   * @returns {void}
   */
  function logDetailedTiming() {
    const timing = performance.timing;
    
    console.group('Detailed Timing Breakdown');
    console.log('DNS Lookup:', (timing.domainLookupEnd - timing.domainLookupStart).toFixed(2), 'ms');
    console.log('TCP Connection:', (timing.connectEnd - timing.connectStart).toFixed(2), 'ms');
    console.log('Request Time:', (timing.responseStart - timing.requestStart).toFixed(2), 'ms');
    console.log('Response Time:', (timing.responseEnd - timing.responseStart).toFixed(2), 'ms');
    console.log('DOM Processing:', (timing.domComplete - timing.domLoading).toFixed(2), 'ms');
    console.log('Load Event:', (timing.loadEventEnd - timing.loadEventStart).toFixed(2), 'ms');
    console.groupEnd();
  }

  /**
   * Log resource loading summary
   * @returns {void}
   */
  function logResourceSummary() {
    console.group('[Performance] Resource Loading Summary');

    const resourceTypes = ['images', 'scripts', 'stylesheets', 'other'];
    
    resourceTypes.forEach((type) => {
      const resources = metrics.resources[type];
      
      if (resources.length === 0) {
        return;
      }

      const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
      const totalDuration = resources.reduce((sum, r) => sum + r.duration, 0);
      const avgDuration = totalDuration / resources.length;
      const cachedCount = resources.filter(r => r.cached).length;

      console.log(`${type}:`, {
        count: resources.length,
        totalSize: formatBytes(totalSize),
        avgDuration: avgDuration.toFixed(2) + ' ms',
        cached: cachedCount,
      });
    });

    console.groupEnd();
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes - Bytes
   * @returns {string} Formatted string
   */
  function formatBytes(bytes) {
    if (bytes === 0) {
      return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Mark custom performance point
   * @param {string} name - Mark name
   * @returns {void}
   */
  function mark(name) {
    if (!performance.mark) {
      return;
    }

    try {
      performance.mark(name);
      console.log(`[Performance] Mark: ${name}`);
    } catch (error) {
      console.warn('[Performance] Failed to create mark:', error.message);
    }
  }

  /**
   * Measure custom performance duration
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   * @returns {number|null} Duration in milliseconds
   */
  function measure(name, startMark, endMark) {
    if (!performance.measure) {
      return null;
    }

    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      if (measure) {
        metrics.custom.set(name, measure.duration);
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)} ms`);
        return measure.duration;
      }
    } catch (error) {
      console.warn('[Performance] Failed to measure:', error.message);
    }

    return null;
  }

  /**
   * Get all collected metrics
   * @returns {Object} Metrics object
   */
  function getMetrics() {
    return {
      navigation: { ...metrics.navigation },
      paint: { ...metrics.paint },
      vitals: { ...metrics.vitals },
      resources: {
        images: [...metrics.resources.images],
        scripts: [...metrics.resources.scripts],
        stylesheets: [...metrics.resources.stylesheets],
        other: [...metrics.resources.other],
      },
      custom: new Map(metrics.custom),
    };
  }

  /**
   * Send metrics to analytics endpoint
   * @param {string} endpoint - Analytics endpoint URL
   * @returns {Promise<void>}
   */
  async function sendToAnalytics(endpoint) {
    if (!endpoint) {
      console.warn('[Performance] No analytics endpoint provided');
      return;
    }

    const payload = {
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      metrics: getMetrics(),
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }

      console.log('[Performance] Metrics sent to analytics');
    } catch (error) {
      console.error('[Performance] Failed to send metrics:', error.message);
    }
  }

  /**
   * Cleanup observers and resources
   * @returns {void}
   */
  function cleanup() {
    Object.values(observers).forEach((observer) => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });

    console.log('[Performance] Cleanup complete');
  }

  // Export public API
  const PerformanceMonitor = {
    init: initPerformanceMonitoring,
    mark,
    measure,
    getMetrics,
    sendToAnalytics,
    cleanup,
  };

  // Attach to window for global access
  if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
  }

  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
  }

})();