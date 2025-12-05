/**
 * Form Validation Module
 * Provides comprehensive validation rules and utilities for contact form
 * 
 * @module form-validation
 * @generated-from: task-005
 * @modifies: scripts/main.js
 */

(function() {
  'use strict';

  /**
   * Validation rule definitions with patterns and constraints
   * @const {Object.<string, ValidationRule>}
   */
  const VALIDATION_RULES = Object.freeze({
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/,
      message: 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)',
      sanitize: (value) => value.trim().replace(/\s+/g, ' '),
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 254, // RFC 5321
      message: 'Please enter a valid email address',
      sanitize: (value) => value.trim().toLowerCase(),
      additionalValidation: (value) => {
        // Check for consecutive dots
        if (/\.\./.test(value)) return 'Email cannot contain consecutive dots';
        // Check local part length (before @)
        const localPart = value.split('@')[0];
        if (localPart.length > 64) return 'Email local part too long';
        return null;
      },
    },
    phone: {
      required: true,
      pattern: /^[\d\s\-\(\)\+]+$/,
      minLength: 10,
      maxLength: 20,
      message: 'Please enter a valid phone number',
      sanitize: (value) => value.trim(),
      additionalValidation: (value) => {
        // Extract digits only
        const digits = value.replace(/\D/g, '');
        if (digits.length < 10) return 'Phone number must contain at least 10 digits';
        if (digits.length > 15) return 'Phone number must not exceed 15 digits';
        return null;
      },
    },
    service: {
      required: true,
      message: 'Please select a service',
      allowedValues: [
        'ac-installation',
        'ac-repair',
        'ac-maintenance',
        'heating-installation',
        'heating-repair',
        'emergency-service',
        'other',
      ],
      sanitize: (value) => value.trim(),
      additionalValidation: (value, rules) => {
        if (!rules.allowedValues.includes(value)) {
          return 'Please select a valid service option';
        }
        return null;
      },
    },
    message: {
      required: false,
      maxLength: 1000,
      minLength: 0,
      message: 'Message must not exceed 1000 characters',
      sanitize: (value) => value.trim().replace(/\s+/g, ' '),
      additionalValidation: (value) => {
        // Check for suspicious patterns (basic spam detection)
        const suspiciousPatterns = [
          /https?:\/\/[^\s]+/gi, // Multiple URLs
          /<script/gi, // Script tags
          /\b(viagra|cialis|casino|lottery)\b/gi, // Common spam words
        ];
        
        let urlCount = 0;
        const urls = value.match(/https?:\/\/[^\s]+/gi);
        if (urls) urlCount = urls.length;
        
        if (urlCount > 2) return 'Message contains too many links';
        
        for (const pattern of suspiciousPatterns.slice(1)) {
          if (pattern.test(value)) {
            return 'Message contains prohibited content';
          }
        }
        
        return null;
      },
    },
  });

  /**
   * Validation result type
   * @typedef {Object} ValidationResult
   * @property {boolean} valid - Whether the field is valid
   * @property {string|null} error - Error message if invalid
   * @property {*} sanitizedValue - Sanitized field value
   */

  /**
   * Validation rule type
   * @typedef {Object} ValidationRule
   * @property {boolean} required - Whether field is required
   * @property {number} [minLength] - Minimum length constraint
   * @property {number} [maxLength] - Maximum length constraint
   * @property {RegExp} [pattern] - Pattern to match
   * @property {string} message - Default error message
   * @property {Function} sanitize - Value sanitization function
   * @property {Function} [additionalValidation] - Additional validation logic
   * @property {Array<string>} [allowedValues] - Allowed values for select fields
   */

  /**
   * Validates a single field value against its rules
   * @param {string} fieldName - Name of the field to validate
   * @param {string} value - Value to validate
   * @returns {ValidationResult} Validation result with error and sanitized value
   */
  function validateField(fieldName, value) {
    const rules = VALIDATION_RULES[fieldName];
    
    if (!rules) {
      console.warn(`No validation rules defined for field: ${fieldName}`);
      return {
        valid: true,
        error: null,
        sanitizedValue: value,
      };
    }

    // Sanitize value first
    const sanitizedValue = rules.sanitize ? rules.sanitize(value) : value.trim();

    // Required validation
    if (rules.required && !sanitizedValue) {
      return {
        valid: false,
        error: `${formatFieldName(fieldName)} is required`,
        sanitizedValue,
      };
    }

    // Skip other validations if field is empty and not required
    if (!sanitizedValue && !rules.required) {
      return {
        valid: true,
        error: null,
        sanitizedValue,
      };
    }

    // Length validation - minimum
    if (rules.minLength !== undefined && sanitizedValue.length < rules.minLength) {
      return {
        valid: false,
        error: `${formatFieldName(fieldName)} must be at least ${rules.minLength} characters`,
        sanitizedValue,
      };
    }

    // Length validation - maximum
    if (rules.maxLength !== undefined && sanitizedValue.length > rules.maxLength) {
      return {
        valid: false,
        error: `${formatFieldName(fieldName)} must not exceed ${rules.maxLength} characters`,
        sanitizedValue,
      };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
      return {
        valid: false,
        error: rules.message,
        sanitizedValue,
      };
    }

    // Additional custom validation
    if (rules.additionalValidation) {
      const additionalError = rules.additionalValidation(sanitizedValue, rules);
      if (additionalError) {
        return {
          valid: false,
          error: additionalError,
          sanitizedValue,
        };
      }
    }

    // All validations passed
    return {
      valid: true,
      error: null,
      sanitizedValue,
    };
  }

  /**
   * Validates all form fields
   * @param {Object.<string, string>} formData - Form data as key-value pairs
   * @returns {Object} Validation results with errors map and overall validity
   */
  function validateForm(formData) {
    const errors = new Map();
    const sanitizedData = {};
    let isValid = true;

    // Validate each field that has rules
    Object.keys(VALIDATION_RULES).forEach(fieldName => {
      const value = formData[fieldName] || '';
      const result = validateField(fieldName, value);
      
      sanitizedData[fieldName] = result.sanitizedValue;
      
      if (!result.valid) {
        errors.set(fieldName, result.error);
        isValid = false;
      }
    });

    return {
      valid: isValid,
      errors,
      sanitizedData,
    };
  }

  /**
   * Validates email format with comprehensive checks
   * @param {string} email - Email address to validate
   * @returns {ValidationResult} Validation result
   */
  function validateEmail(email) {
    return validateField('email', email);
  }

  /**
   * Validates phone number format
   * @param {string} phone - Phone number to validate
   * @returns {ValidationResult} Validation result
   */
  function validatePhone(phone) {
    return validateField('phone', phone);
  }

  /**
   * Validates name format
   * @param {string} name - Name to validate
   * @returns {ValidationResult} Validation result
   */
  function validateName(name) {
    return validateField('name', name);
  }

  /**
   * Validates service selection
   * @param {string} service - Service value to validate
   * @returns {ValidationResult} Validation result
   */
  function validateService(service) {
    return validateField('service', service);
  }

  /**
   * Validates message content
   * @param {string} message - Message to validate
   * @returns {ValidationResult} Validation result
   */
  function validateMessage(message) {
    return validateField('message', message);
  }

  /**
   * Formats field name for display in error messages
   * @param {string} fieldName - Field name to format
   * @returns {string} Formatted field name
   */
  function formatFieldName(fieldName) {
    const nameMap = {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      service: 'Service',
      message: 'Message',
    };
    return nameMap[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  }

  /**
   * Sanitizes a string value by removing potentially harmful content
   * @param {string} value - Value to sanitize
   * @returns {string} Sanitized value
   */
  function sanitizeString(value) {
    if (typeof value !== 'string') return '';
    
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 1000); // Limit length
  }

  /**
   * Checks if a value is empty (null, undefined, empty string, or whitespace)
   * @param {*} value - Value to check
   * @returns {boolean} True if value is empty
   */
  function isEmpty(value) {
    return value === null || 
           value === undefined || 
           (typeof value === 'string' && value.trim() === '');
  }

  /**
   * Gets validation rules for a specific field
   * @param {string} fieldName - Name of the field
   * @returns {ValidationRule|null} Validation rules or null if not found
   */
  function getFieldRules(fieldName) {
    return VALIDATION_RULES[fieldName] || null;
  }

  /**
   * Checks if a field is required
   * @param {string} fieldName - Name of the field
   * @returns {boolean} True if field is required
   */
  function isFieldRequired(fieldName) {
    const rules = VALIDATION_RULES[fieldName];
    return rules ? rules.required : false;
  }

  /**
   * Gets all required field names
   * @returns {Array<string>} Array of required field names
   */
  function getRequiredFields() {
    return Object.keys(VALIDATION_RULES).filter(fieldName => 
      VALIDATION_RULES[fieldName].required
    );
  }

  /**
   * Validates multiple fields at once with early exit on first error
   * @param {Object.<string, string>} fields - Fields to validate
   * @returns {ValidationResult|null} First validation error or null if all valid
   */
  function validateFieldsFast(fields) {
    for (const [fieldName, value] of Object.entries(fields)) {
      const result = validateField(fieldName, value);
      if (!result.valid) {
        return {
          fieldName,
          ...result,
        };
      }
    }
    return null;
  }

  /**
   * Creates a debounced validation function
   * @param {Function} validationFn - Validation function to debounce
   * @param {number} delay - Debounce delay in milliseconds
   * @returns {Function} Debounced validation function
   */
  function createDebouncedValidator(validationFn, delay = 300) {
    let timeoutId = null;
    
    return function(...args) {
      return new Promise((resolve) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          const result = validationFn(...args);
          resolve(result);
          timeoutId = null;
        }, delay);
      });
    };
  }

  // Export validation utilities
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
      validateField,
      validateForm,
      validateEmail,
      validatePhone,
      validateName,
      validateService,
      validateMessage,
      sanitizeString,
      isEmpty,
      getFieldRules,
      isFieldRequired,
      getRequiredFields,
      validateFieldsFast,
      createDebouncedValidator,
      VALIDATION_RULES,
    };
  } else {
    // Browser environment - attach to window
    window.FormValidation = {
      validateField,
      validateForm,
      validateEmail,
      validatePhone,
      validateName,
      validateService,
      validateMessage,
      sanitizeString,
      isEmpty,
      getFieldRules,
      isFieldRequired,
      getRequiredFields,
      validateFieldsFast,
      createDebouncedValidator,
      VALIDATION_RULES,
    };
  }

})();