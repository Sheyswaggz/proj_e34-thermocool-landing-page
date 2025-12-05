/**
 * Form Validation and Submission Handler
 * Provides real-time validation, submission handling, and user feedback
 */

(function() {
  'use strict';

  // Form state management
  const formState = {
    isSubmitting: false,
    lastSubmission: null,
    validationErrors: new Map(),
  };

  // Validation rules
  const validators = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/,
      message: 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)',
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
    phone: {
      required: true,
      pattern: /^[\d\s\-\(\)\+]+$/,
      minLength: 10,
      message: 'Please enter a valid phone number',
    },
    service: {
      required: true,
      message: 'Please select a service',
    },
    message: {
      required: false,
      maxLength: 1000,
      message: 'Message must not exceed 1000 characters',
    },
  };

  // Rate limiting configuration
  const RATE_LIMIT = {
    maxAttempts: 3,
    windowMs: 60000, // 1 minute
    attempts: [],
  };

  /**
   * Initialize form validation and submission handling
   */
  function initializeForm() {
    const form = document.querySelector('.form');
    if (!form) return;

    // Load persisted form data
    loadFormData(form);

    // Set up real-time validation
    setupRealtimeValidation(form);

    // Set up form submission
    setupFormSubmission(form);

    // Set up form persistence
    setupFormPersistence(form);

    // Add ARIA live region for announcements
    addAriaLiveRegion();
  }

  /**
   * Set up real-time validation for form fields
   */
  function setupRealtimeValidation(form) {
    const fields = form.querySelectorAll('.form__input, .form__select, .form__textarea');

    fields.forEach(field => {
      // Validate on blur
      field.addEventListener('blur', () => {
        validateField(field);
      });

      // Validate on input (debounced)
      let validationTimeout;
      field.addEventListener('input', () => {
        clearTimeout(validationTimeout);
        validationTimeout = setTimeout(() => {
          if (field.value.length > 0 || formState.validationErrors.has(field.name)) {
            validateField(field);
          }
        }, 300);
      });
    });
  }

  /**
   * Validate a single form field
   */
  function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const rules = validators[fieldName];

    if (!rules) return true;

    // Remove existing error
    clearFieldError(field);

    // Required validation
    if (rules.required && !value) {
      setFieldError(field, `${getFieldLabel(field)} is required`);
      return false;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      formState.validationErrors.delete(fieldName);
      field.classList.remove('form__input--error', 'form__select--error', 'form__textarea--error');
      field.classList.add('form__input--success', 'form__select--success', 'form__textarea--success');
      return true;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      setFieldError(field, rules.message);
      return false;
    }

    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      setFieldError(field, `${getFieldLabel(field)} must be at least ${rules.minLength} characters`);
      return false;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      setFieldError(field, `${getFieldLabel(field)} must not exceed ${rules.maxLength} characters`);
      return false;
    }

    // Field is valid
    formState.validationErrors.delete(fieldName);
    field.classList.remove('form__input--error', 'form__select--error', 'form__textarea--error');
    field.classList.add('form__input--success', 'form__select--success', 'form__textarea--success');
    
    return true;
  }

  /**
   * Set error state for a field
   */
  function setFieldError(field, message) {
    const fieldName = field.name;
    formState.validationErrors.set(fieldName, message);

    // Add error class
    field.classList.add('form__input--error', 'form__select--error', 'form__textarea--error');
    field.classList.remove('form__input--success', 'form__select--success', 'form__textarea--success');

    // Create or update error message
    let errorElement = field.parentElement.querySelector('.form__error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'form__error';
      errorElement.setAttribute('role', 'alert');
      field.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;

    // Update ARIA
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', `${fieldName}-error`);
    errorElement.id = `${fieldName}-error`;
  }

  /**
   * Clear error state for a field
   */
  function clearFieldError(field) {
    const errorElement = field.parentElement.querySelector('.form__error');
    if (errorElement) {
      errorElement.remove();
    }
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }

  /**
   * Get field label text
   */
  function getFieldLabel(field) {
    const label = field.parentElement.querySelector('.form__label');
    return label ? label.textContent.replace('*', '').trim() : field.name;
  }

  /**
   * Set up form submission handling
   */
  function setupFormSubmission(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Prevent double submission
      if (formState.isSubmitting) return;

      // Check rate limiting
      if (!checkRateLimit()) {
        showSubmissionError('Too many submission attempts. Please wait a moment and try again.');
        return;
      }

      // Validate all fields
      const fields = form.querySelectorAll('.form__input, .form__select, .form__textarea');
      let isValid = true;

      fields.forEach(field => {
        if (!validateField(field)) {
          isValid = false;
        }
      });

      if (!isValid) {
        announceToScreenReader('Form contains errors. Please correct them and try again.');
        // Focus first error field
        const firstError = form.querySelector('.form__input--error, .form__select--error, .form__textarea--error');
        if (firstError) {
          firstError.focus();
        }
        return;
      }

      // Submit form
      await submitForm(form);
    });
  }

  /**
   * Check rate limiting
   */
  function checkRateLimit() {
    const now = Date.now();
    
    // Remove old attempts
    RATE_LIMIT.attempts = RATE_LIMIT.attempts.filter(
      timestamp => now - timestamp < RATE_LIMIT.windowMs
    );

    // Check if limit exceeded
    if (RATE_LIMIT.attempts.length >= RATE_LIMIT.maxAttempts) {
      return false;
    }

    // Add current attempt
    RATE_LIMIT.attempts.push(now);
    return true;
  }

  /**
   * Submit form data
   */
  async function submitForm(form) {
    formState.isSubmitting = true;
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.classList.add('btn--loading');
    submitButton.disabled = true;
    form.classList.add('form--submitting');

    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      // Simulate API call (replace with actual endpoint)
      await simulateApiCall(data);

      // Success
      formState.lastSubmission = Date.now();
      showSubmissionSuccess();
      clearFormData();
      form.reset();
      
      // Clear validation states
      const fields = form.querySelectorAll('.form__input, .form__select, .form__textarea');
      fields.forEach(field => {
        field.classList.remove('form__input--success', 'form__select--success', 'form__textarea--success');
        clearFieldError(field);
      });

      announceToScreenReader('Form submitted successfully! We will contact you soon.');

    } catch (error) {
      // Error
      showSubmissionError('Unable to submit form. Please try again later.');
      announceToScreenReader('Form submission failed. Please try again.');
      console.error('Form submission error:', error);

    } finally {
      // Reset loading state
      formState.isSubmitting = false;
      submitButton.classList.remove('btn--loading');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      form.classList.remove('form--submitting');
    }
  }

  /**
   * Simulate API call
   */
  function simulateApiCall(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve({ success: true, data });
        } else {
          reject(new Error('Simulated API error'));
        }
      }, 1500);
    });
  }

  /**
   * Show submission success message
   */
  function showSubmissionSuccess() {
    const form = document.querySelector('.form');
    let successElement = form.querySelector('.form__submit-success');
    
    if (!successElement) {
      successElement = document.createElement('div');
      successElement.className = 'form__submit-success';
      successElement.setAttribute('role', 'status');
      successElement.setAttribute('aria-live', 'polite');
      form.insertBefore(successElement, form.firstChild);
    }

    successElement.textContent = 'Thank you for contacting us! We will get back to you within 24 hours.';
    successElement.classList.add('form__submit-success--visible');

    // Hide after 10 seconds
    setTimeout(() => {
      successElement.classList.remove('form__submit-success--visible');
    }, 10000);
  }

  /**
   * Show submission error message
   */
  function showSubmissionError(message) {
    const form = document.querySelector('.form');
    let errorElement = form.querySelector('.form__submit-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'form__submit-error';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'assertive');
      form.insertBefore(errorElement, form.firstChild);
    }

    errorElement.textContent = message;
    errorElement.classList.add('form__submit-error--visible');

    // Hide after 10 seconds
    setTimeout(() => {
      errorElement.classList.remove('form__submit-error--visible');
    }, 10000);
  }

  /**
   * Set up form persistence with localStorage
   */
  function setupFormPersistence(form) {
    const fields = form.querySelectorAll('.form__input, .form__select, .form__textarea');

    fields.forEach(field => {
      field.addEventListener('input', () => {
        saveFormData(form);
      });
    });
  }

  /**
   * Save form data to localStorage
   */
  function saveFormData(form) {
    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      localStorage.setItem('thermocool_contact_form', JSON.stringify(data));
    } catch (error) {
      console.warn('Unable to save form data:', error);
    }
  }

  /**
   * Load form data from localStorage
   */
  function loadFormData(form) {
    try {
      const savedData = localStorage.getItem('thermocool_contact_form');
      if (!savedData) return;

      const data = JSON.parse(savedData);
      Object.entries(data).forEach(([name, value]) => {
        const field = form.querySelector(`[name="${name}"]`);
        if (field && value) {
          field.value = value;
        }
      });
    } catch (error) {
      console.warn('Unable to load form data:', error);
    }
  }

  /**
   * Clear form data from localStorage
   */
  function clearFormData() {
    try {
      localStorage.removeItem('thermocool_contact_form');
    } catch (error) {
      console.warn('Unable to clear form data:', error);
    }
  }

  /**
   * Add ARIA live region for screen reader announcements
   */
  function addAriaLiveRegion() {
    if (document.getElementById('aria-live-region')) return;

    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }

  /**
   * Announce message to screen readers
   */
  function announceToScreenReader(message) {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeForm);
  } else {
    initializeForm();
  }

})();