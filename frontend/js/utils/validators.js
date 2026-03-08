/**
 * Form Validation Utilities
 * 
 * Provides validation functions for email, password, and required fields.
 * Generates user-friendly error messages for validation failures.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4
 */

/**
 * Validates email format using RFC 5322 compliant regex
 * @param {string} email - Email address to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required'
    };
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return {
      isValid: false,
      error: 'Email is required'
    };
  }

  // RFC 5322 compliant email regex (simplified but comprehensive)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }

  // Additional checks for common mistakes
  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      error: 'Email address is too long'
    };
  }

  const [localPart, domain] = trimmedEmail.split('@');
  
  if (localPart.length > 64) {
    return {
      isValid: false,
      error: 'Email address is invalid'
    };
  }

  if (domain && domain.includes('..')) {
    return {
      isValid: false,
      error: 'Email address is invalid'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates password strength based on security requirements
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, error: string|null, strength: string }
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      error: 'Password is required',
      strength: 'none'
    };
  }

  if (password.length === 0) {
    return {
      isValid: false,
      error: 'Password is required',
      strength: 'none'
    };
  }

  // Minimum length requirement
  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
      strength: 'weak'
    };
  }

  // Maximum length for security (prevent DoS)
  if (password.length > 128) {
    return {
      isValid: false,
      error: 'Password is too long (maximum 128 characters)',
      strength: 'none'
    };
  }

  // Check for required character types
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const characterTypeCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  // Require at least 3 out of 4 character types
  if (characterTypeCount < 3) {
    const missing = [];
    if (!hasUpperCase) missing.push('uppercase letter');
    if (!hasLowerCase) missing.push('lowercase letter');
    if (!hasNumber) missing.push('number');
    if (!hasSpecialChar) missing.push('special character');

    return {
      isValid: false,
      error: `Password must contain at least 3 of: uppercase, lowercase, number, special character`,
      strength: 'weak'
    };
  }

  // Calculate strength
  let strength = 'medium';
  
  if (password.length >= 12 && characterTypeCount === 4) {
    strength = 'strong';
  } else if (password.length >= 10 && characterTypeCount >= 3) {
    strength = 'medium';
  }

  return {
    isValid: true,
    error: null,
    strength
  };
}

/**
 * Validates that a required field is not empty
 * @param {string} value - Field value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateRequired(value, fieldName = 'This field') {
  if (value === null || value === undefined) {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates minimum length for a field
 * @param {string} value - Field value to validate
 * @param {number} minLength - Minimum required length
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateMinLength(value, minLength, fieldName = 'This field') {
  if (!value || typeof value !== 'string') {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates maximum length for a field
 * @param {string} value - Field value to validate
 * @param {number} maxLength - Maximum allowed length
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateMaxLength(value, maxLength, fieldName = 'This field') {
  if (!value || typeof value !== 'string') {
    return {
      isValid: true,
      error: null
    };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates that a value matches a pattern
 * @param {string} value - Field value to validate
 * @param {RegExp} pattern - Regular expression pattern to match
 * @param {string} errorMessage - Custom error message
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validatePattern(value, pattern, errorMessage = 'Invalid format') {
  if (!value || typeof value !== 'string') {
    return {
      isValid: false,
      error: errorMessage
    };
  }

  if (!pattern.test(value)) {
    return {
      isValid: false,
      error: errorMessage
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates that two fields match (e.g., password confirmation)
 * @param {string} value1 - First value
 * @param {string} value2 - Second value
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateMatch(value1, value2, fieldName = 'Fields') {
  if (value1 !== value2) {
    return {
      isValid: false,
      error: `${fieldName} do not match`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validates a form with multiple fields
 * @param {Object} formData - Object containing field values
 * @param {Object} validationRules - Object containing validation rules for each field
 * @returns {Object} { isValid: boolean, errors: Object }
 * 
 * Example:
 * validateForm(
 *   { email: 'test@example.com', password: 'Pass123!' },
 *   {
 *     email: [{ validator: validateEmail }],
 *     password: [{ validator: validatePassword }]
 *   }
 * )
 */
export function validateForm(formData, validationRules) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const fieldValue = formData[fieldName];

    for (const rule of rules) {
      const result = rule.validator(fieldValue, ...rule.args || []);
      
      if (!result.isValid) {
        errors[fieldName] = result.error;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    isValid,
    errors
  };
}

/**
 * Generates a validation error message for display
 * @param {string} fieldName - Name of the field
 * @param {string} error - Error message
 * @returns {string} Formatted error message
 */
export function generateErrorMessage(fieldName, error) {
  if (!error) return '';
  return error;
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export default {
  validateEmail,
  validatePassword,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  validateMatch,
  validateForm,
  generateErrorMessage,
  sanitizeInput
};
