/**
 * Form Validation Utilities Tests
 * 
 * Unit tests for form validation functions.
 * Tests email validation, password strength, required fields, and error messages.
 */

import { describe, test, expect } from '@jest/globals';
import {
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
} from './validators.js';

describe('Email Validation', () => {
  describe('Valid emails', () => {
    test('should accept standard email format', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should accept email with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should accept email with plus sign', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should accept email with dots in local part', () => {
      const result = validateEmail('first.last@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should accept email with numbers', () => {
      const result = validateEmail('user123@example456.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should accept email with hyphens in domain', () => {
      const result = validateEmail('user@my-domain.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should accept email with underscores', () => {
      const result = validateEmail('user_name@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should trim whitespace and validate', () => {
      const result = validateEmail('  user@example.com  ');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('Invalid emails', () => {
    test('should reject empty string', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    test('should reject null', () => {
      const result = validateEmail(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    test('should reject undefined', () => {
      const result = validateEmail(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    test('should reject email without @', () => {
      const result = validateEmail('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    test('should reject email without domain', () => {
      const result = validateEmail('user@');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    test('should reject email without local part', () => {
      const result = validateEmail('@example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    test('should reject email with spaces', () => {
      const result = validateEmail('user name@example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    test('should reject email with multiple @ symbols', () => {
      const result = validateEmail('user@@example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    test('should reject email with consecutive dots in domain', () => {
      const result = validateEmail('user@example..com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    test('should reject email that is too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email address is too long');
    });

    test('should reject email with local part too long', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      const result = validateEmail(longLocal);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email address is invalid');
    });

    test('should reject non-string input', () => {
      const result = validateEmail(12345);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });
  });
});

describe('Password Validation', () => {
  describe('Valid passwords', () => {
    test('should accept strong password with all character types', () => {
      const result = validatePassword('Pass123!@#');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.strength).toBe('medium');
    });

    test('should accept password with 12+ chars and all types as strong', () => {
      const result = validatePassword('MyP@ssw0rd123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.strength).toBe('strong');
    });

    test('should accept password with 10+ chars and 3 types as medium', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.strength).toBe('medium');
    });

    test('should accept password with uppercase, lowercase, and numbers', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should accept password with uppercase, lowercase, and special chars', () => {
      const result = validatePassword('Password!@#');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should accept password with lowercase, numbers, and special chars', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('Invalid passwords', () => {
    test('should reject empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
      expect(result.strength).toBe('none');
    });

    test('should reject null', () => {
      const result = validatePassword(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
      expect(result.strength).toBe('none');
    });

    test('should reject undefined', () => {
      const result = validatePassword(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
      expect(result.strength).toBe('none');
    });

    test('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
      expect(result.strength).toBe('weak');
    });

    test('should reject password longer than 128 characters', () => {
      const longPassword = 'P@ssw0rd' + 'a'.repeat(125);
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is too long (maximum 128 characters)');
    });

    test('should reject password with only lowercase', () => {
      const result = validatePassword('password');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 3 of');
      expect(result.strength).toBe('weak');
    });

    test('should reject password with only uppercase', () => {
      const result = validatePassword('PASSWORD');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 3 of');
      expect(result.strength).toBe('weak');
    });

    test('should reject password with only numbers', () => {
      const result = validatePassword('12345678');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 3 of');
      expect(result.strength).toBe('weak');
    });

    test('should reject password with only two character types', () => {
      const result = validatePassword('password123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 3 of');
      expect(result.strength).toBe('weak');
    });

    test('should reject non-string input', () => {
      const result = validatePassword(12345678);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });
  });
});

describe('Required Field Validation', () => {
  test('should accept non-empty string', () => {
    const result = validateRequired('value', 'Field');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should accept string with spaces', () => {
    const result = validateRequired('  value  ', 'Field');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should reject empty string', () => {
    const result = validateRequired('', 'Field');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Field is required');
  });

  test('should reject string with only whitespace', () => {
    const result = validateRequired('   ', 'Field');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Field is required');
  });

  test('should reject null', () => {
    const result = validateRequired(null, 'Field');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Field is required');
  });

  test('should reject undefined', () => {
    const result = validateRequired(undefined, 'Field');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Field is required');
  });

  test('should use default field name when not provided', () => {
    const result = validateRequired('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('This field is required');
  });

  test('should use custom field name in error message', () => {
    const result = validateRequired('', 'Username');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username is required');
  });
});

describe('Minimum Length Validation', () => {
  test('should accept string meeting minimum length', () => {
    const result = validateMinLength('12345', 5, 'Field');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should accept string exceeding minimum length', () => {
    const result = validateMinLength('123456', 5, 'Field');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should reject string shorter than minimum', () => {
    const result = validateMinLength('1234', 5, 'Field');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Field must be at least 5 characters');
  });

  test('should reject empty string', () => {
    const result = validateMinLength('', 5, 'Field');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Field must be at least 5 characters');
  });

  test('should reject null', () => {
    const result = validateMinLength(null, 5, 'Field');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Field must be at least 5 characters');
  });

  test('should use default field name when not provided', () => {
    const result = validateMinLength('123', 5);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('This field must be at least 5 characters');
  });
});

describe('Maximum Length Validation', () => {
  test('should accept string within maximum length', () => {
    const result = validateMaxLength('12345', 10, 'Field');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should accept string at maximum length', () => {
    const result = validateMaxLength('12345', 5, 'Field');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should reject string exceeding maximum length', () => {
    const result = validateMaxLength('123456', 5, 'Field');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Field must not exceed 5 characters');
  });

  test('should accept empty string', () => {
    const result = validateMaxLength('', 5, 'Field');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should accept null', () => {
    const result = validateMaxLength(null, 5, 'Field');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should use default field name when not provided', () => {
    const result = validateMaxLength('123456', 5);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('This field must not exceed 5 characters');
  });
});

describe('Pattern Validation', () => {
  test('should accept string matching pattern', () => {
    const pattern = /^[0-9]+$/;
    const result = validatePattern('12345', pattern, 'Must be numbers only');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should reject string not matching pattern', () => {
    const pattern = /^[0-9]+$/;
    const result = validatePattern('abc123', pattern, 'Must be numbers only');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Must be numbers only');
  });

  test('should reject empty string', () => {
    const pattern = /^[0-9]+$/;
    const result = validatePattern('', pattern, 'Must be numbers only');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Must be numbers only');
  });

  test('should use default error message', () => {
    const pattern = /^[0-9]+$/;
    const result = validatePattern('abc', pattern);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid format');
  });
});

describe('Match Validation', () => {
  test('should accept matching strings', () => {
    const result = validateMatch('password', 'password', 'Passwords');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should reject non-matching strings', () => {
    const result = validateMatch('password1', 'password2', 'Passwords');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Passwords do not match');
  });

  test('should reject when one is empty', () => {
    const result = validateMatch('password', '', 'Passwords');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Passwords do not match');
  });

  test('should use default field name', () => {
    const result = validateMatch('value1', 'value2');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Fields do not match');
  });
});

describe('Form Validation', () => {
  test('should validate form with all valid fields', () => {
    const formData = {
      email: 'user@example.com',
      password: 'Pass123!@#',
      name: 'John Doe'
    };

    const rules = {
      email: [{ validator: validateEmail }],
      password: [{ validator: validatePassword }],
      name: [{ validator: validateRequired, args: ['Name'] }]
    };

    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test('should return errors for invalid fields', () => {
    const formData = {
      email: 'invalid-email',
      password: 'weak',
      name: ''
    };

    const rules = {
      email: [{ validator: validateEmail }],
      password: [{ validator: validatePassword }],
      name: [{ validator: validateRequired, args: ['Name'] }]
    };

    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Please enter a valid email address');
    expect(result.errors.password).toBe('Password must be at least 8 characters long');
    expect(result.errors.name).toBe('Name is required');
  });

  test('should validate with multiple rules per field', () => {
    const formData = {
      username: 'ab'
    };

    const rules = {
      username: [
        { validator: validateRequired, args: ['Username'] },
        { validator: validateMinLength, args: [3, 'Username'] }
      ]
    };

    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(false);
    expect(result.errors.username).toBe('Username must be at least 3 characters');
  });

  test('should stop at first error for each field', () => {
    const formData = {
      username: ''
    };

    const rules = {
      username: [
        { validator: validateRequired, args: ['Username'] },
        { validator: validateMinLength, args: [3, 'Username'] }
      ]
    };

    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(false);
    expect(result.errors.username).toBe('Username is required');
  });

  test('should handle empty form data', () => {
    const formData = {};
    const rules = {};

    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });
});

describe('Error Message Generation', () => {
  test('should return error message as-is', () => {
    const message = generateErrorMessage('Email', 'Invalid email format');
    expect(message).toBe('Invalid email format');
  });

  test('should return empty string for null error', () => {
    const message = generateErrorMessage('Email', null);
    expect(message).toBe('');
  });

  test('should return empty string for undefined error', () => {
    const message = generateErrorMessage('Email', undefined);
    expect(message).toBe('');
  });

  test('should return empty string for empty error', () => {
    const message = generateErrorMessage('Email', '');
    expect(message).toBe('');
  });
});

describe('Input Sanitization', () => {
  test('should escape HTML tags', () => {
    const result = sanitizeInput('<script>alert("XSS")</script>');
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  test('should escape ampersands', () => {
    const result = sanitizeInput('Tom & Jerry');
    expect(result).toBe('Tom &amp; Jerry');
  });

  test('should escape quotes', () => {
    const result = sanitizeInput('He said "Hello"');
    expect(result).toBe('He said &quot;Hello&quot;');
  });

  test('should escape apostrophes', () => {
    const result = sanitizeInput("It's a test");
    expect(result).toBe('It&#x27;s a test');
  });

  test('should escape forward slashes', () => {
    const result = sanitizeInput('path/to/file');
    expect(result).toBe('path&#x2F;to&#x2F;file');
  });

  test('should handle multiple special characters', () => {
    const result = sanitizeInput('<div class="test">Hello & "Goodbye"</div>');
    expect(result).toBe('&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;Goodbye&quot;&lt;&#x2F;div&gt;');
  });

  test('should return empty string for null', () => {
    const result = sanitizeInput(null);
    expect(result).toBe('');
  });

  test('should return empty string for undefined', () => {
    const result = sanitizeInput(undefined);
    expect(result).toBe('');
  });

  test('should return empty string for non-string input', () => {
    const result = sanitizeInput(12345);
    expect(result).toBe('');
  });

  test('should handle empty string', () => {
    const result = sanitizeInput('');
    expect(result).toBe('');
  });

  test('should not modify safe strings', () => {
    const result = sanitizeInput('Hello World 123');
    expect(result).toBe('Hello World 123');
  });
});

describe('Edge Cases', () => {
  test('should handle unicode characters in email', () => {
    const result = validateEmail('user@例え.jp');
    // Most email validators don't support unicode domains without punycode
    expect(result.isValid).toBe(false);
  });

  test('should handle very long valid password', () => {
    const longPassword = 'P@ssw0rd' + 'a'.repeat(100);
    const result = validatePassword(longPassword);
    expect(result.isValid).toBe(true);
  });

  test('should handle password with all special characters', () => {
    const result = validatePassword('P@ss!#$%^&*()_+-=[]{}|;:,.<>?');
    expect(result.isValid).toBe(true);
  });

  test('should handle form validation with no rules', () => {
    const formData = { field: 'value' };
    const rules = {};
    const result = validateForm(formData, rules);
    expect(result.isValid).toBe(true);
  });

  test('should handle sanitization of already escaped HTML', () => {
    const result = sanitizeInput('&lt;script&gt;');
    expect(result).toBe('&amp;lt;script&amp;gt;');
  });
});
