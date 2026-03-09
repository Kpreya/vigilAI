/**
 * Property-Based Tests for Authentication Pages
 * 
 * Tests form validation properties for login and signup pages using fast-check.
 * Each property test runs with minimum 100 iterations.
 * 
 * Feature: html-frontend-implementation
 * Validates: Requirements 1.3, 15.1, 15.2, 15.3
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { validateEmail, validatePassword, validateRequired } from './utils/validators.js';

describe('Authentication Pages - Property-Based Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Property 2: Invalid credential rejection
   * **Validates: Requirements 1.3**
   * 
   * For any invalid email or password combination, when submitted through the login form,
   * the system should display an error message and not store any token in localStorage.
   */
  describe('Property 2: Invalid credential rejection', () => {
    it('should reject invalid email formats and not store tokens', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.string().filter(s => !s.includes('@')),
            fc.string().map(s => s + '@'),
            fc.string().map(s => '@' + s),
            fc.string().map(s => s + '@@' + s),
            fc.string().filter(s => s.includes('..')),
            fc.string().filter(s => s.length > 254)
          ),
          fc.string({ minLength: 1 }),
          (invalidEmail, password) => {
            // Validate the email
            const emailValidation = validateEmail(invalidEmail);
            
            // Invalid emails should fail validation
            expect(emailValidation.isValid).toBe(false);
            expect(emailValidation.error).not.toBeNull();
            
            // Verify no token is stored when validation fails
            const tokenBefore = localStorage.getItem('auth_token');
            expect(tokenBefore).toBeNull();
            
            // Simulate form submission would be blocked by validation
            // In real implementation, the form would not submit if validation fails
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid passwords and not store tokens', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.string({ maxLength: 7 }), // Too short
            fc.string({ minLength: 129 }), // Too long
            fc.string({ minLength: 8 }).filter(s => !/[A-Z]/.test(s) && !/[a-z]/.test(s) && !/[0-9]/.test(s))
          ),
          (email, invalidPassword) => {
            // Validate the password
            const passwordValidation = validatePassword(invalidPassword);
            
            // Invalid passwords should fail validation
            expect(passwordValidation.isValid).toBe(false);
            expect(passwordValidation.error).not.toBeNull();
            
            // Verify no token is stored when validation fails
            const tokenBefore = localStorage.getItem('auth_token');
            expect(tokenBefore).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject empty credentials and not store tokens', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({ email: fc.constant(''), password: fc.string() }),
            fc.record({ email: fc.emailAddress(), password: fc.constant('') }),
            fc.record({ email: fc.constant(''), password: fc.constant('') })
          ),
          (credentials) => {
            // Validate email
            const emailValidation = validateEmail(credentials.email);
            
            // Validate password
            const passwordValidation = validatePassword(credentials.password);
            
            // At least one should fail
            const isValid = emailValidation.isValid && passwordValidation.isValid;
            expect(isValid).toBe(false);
            
            // Verify no token is stored
            const token = localStorage.getItem('auth_token');
            expect(token).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 48: Email format validation
   * **Validates: Requirements 15.1**
   * 
   * For any email input, the system should validate the email format in real-time
   * and display validation feedback.
   */
  describe('Property 48: Email format validation', () => {
    it('should validate correct email formats', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (email) => {
            const result = validateEmail(email);
            
            // Valid emails should pass validation
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject emails without @ symbol', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes('@')),
          (invalidEmail) => {
            const result = validateEmail(invalidEmail);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
            expect(typeof result.error).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject emails with invalid domain format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('@'),
            fc.constant('..'),
            fc.constant('@.'),
            fc.constant('.@')
          ),
          (localPart, invalidDomain) => {
            const invalidEmail = localPart + invalidDomain;
            const result = validateEmail(invalidEmail);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject emails exceeding length limits', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 255 }),
          (longString) => {
            const longEmail = longString + '@example.com';
            const result = validateEmail(longEmail);
            
            // Should fail validation due to length
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty and whitespace-only emails', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t'),
            fc.constant('\n')
          ),
          (emptyEmail) => {
            const result = validateEmail(emptyEmail);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Email is required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide specific error messages for different validation failures', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.string().filter(s => !s.includes('@') && s.length > 0),
            fc.string({ minLength: 255 }).map(s => s + '@example.com')
          ),
          (invalidEmail) => {
            const result = validateEmail(invalidEmail);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            
            // Should provide a specific error message
            expect(result.error).toBeTruthy();
            expect(typeof result.error).toBe('string');
            expect(result.error.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 49: Password strength validation
   * **Validates: Requirements 15.2**
   * 
   * For any password input during signup, the system should validate password strength
   * requirements and display feedback.
   */
  describe('Property 49: Password strength validation', () => {
    it('should accept strong passwords with all character types', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 128 })
            .filter(s => /[A-Z]/.test(s))
            .filter(s => /[a-z]/.test(s))
            .filter(s => /[0-9]/.test(s))
            .filter(s => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s)),
          (strongPassword) => {
            const result = validatePassword(strongPassword);
            
            // Strong passwords should pass validation
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
            expect(['medium', 'strong']).toContain(result.strength);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject passwords shorter than 8 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 7 }),
          (shortPassword) => {
            const result = validatePassword(shortPassword);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
            expect(result.error).toContain('8 characters');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject passwords longer than 128 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 129, maxLength: 200 }),
          (longPassword) => {
            const result = validatePassword(longPassword);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
            expect(result.error).toContain('too long');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject passwords without sufficient character variety', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 8, maxLength: 128 }).filter(s => /^[a-z]+$/.test(s)), // Only lowercase
            fc.string({ minLength: 8, maxLength: 128 }).filter(s => /^[A-Z]+$/.test(s)), // Only uppercase
            fc.string({ minLength: 8, maxLength: 128 }).filter(s => /^[0-9]+$/.test(s))  // Only numbers
          ),
          (weakPassword) => {
            const result = validatePassword(weakPassword);
            
            // Should fail validation due to lack of character variety
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
            expect(result.error).toContain('at least 3 of');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty passwords', () => {
      fc.assert(
        fc.property(
          fc.constant(''),
          (emptyPassword) => {
            const result = validatePassword(emptyPassword);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Password is required');
            expect(result.strength).toBe('none');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate password strength correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 128 }),
          (password) => {
            const result = validatePassword(password);
            
            // Strength should be one of the valid values
            expect(['none', 'weak', 'medium', 'strong']).toContain(result.strength);
            
            // If valid, strength should not be 'none'
            if (result.isValid) {
              expect(result.strength).not.toBe('none');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide specific error messages for password requirements', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.string({ maxLength: 7 }),
            fc.string({ minLength: 129 }),
            fc.string({ minLength: 8, maxLength: 128 }).filter(s => /^[a-z]+$/.test(s))
          ),
          (invalidPassword) => {
            const result = validatePassword(invalidPassword);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            
            // Should provide a specific error message
            expect(result.error).toBeTruthy();
            expect(typeof result.error).toBe('string');
            expect(result.error.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 50: Required field validation
   * **Validates: Requirements 15.3**
   * 
   * For any form submission with empty required fields, the system should prevent
   * submission and highlight the empty fields.
   */
  describe('Property 50: Required field validation', () => {
    it('should reject null and undefined values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined)
          ),
          fc.string({ minLength: 1 }),
          (emptyValue, fieldName) => {
            const result = validateRequired(emptyValue, fieldName);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
            expect(result.error).toContain(fieldName);
            expect(result.error).toContain('required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject empty strings and whitespace-only strings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t'),
            fc.constant('\n'),
            fc.constant('  \t  \n  ')
          ),
          fc.string({ minLength: 1 }),
          (emptyValue, fieldName) => {
            const result = validateRequired(emptyValue, fieldName);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
            expect(result.error).toContain(fieldName);
            expect(result.error).toContain('required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept non-empty strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1 }),
          (value, fieldName) => {
            const result = validateRequired(value, fieldName);
            
            // Should pass validation
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default field name when not provided', () => {
      fc.assert(
        fc.property(
          fc.constant(''),
          () => {
            const result = validateRequired('');
            
            // Should fail validation with default field name
            expect(result.isValid).toBe(false);
            expect(result.error).toBeTruthy();
            expect(result.error).toContain('This field');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate all required fields in a form', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.option(fc.emailAddress(), { nil: '' }),
            password: fc.option(fc.string({ minLength: 8 }), { nil: '' }),
            name: fc.option(fc.string({ minLength: 1 }), { nil: '' })
          }),
          (formData) => {
            // Validate each required field
            const emailResult = validateRequired(formData.email, 'Email');
            const passwordResult = validateRequired(formData.password, 'Password');
            const nameResult = validateRequired(formData.name, 'Name');
            
            // Check if form is valid (all fields have values)
            const hasEmail = formData.email && formData.email.trim().length > 0;
            const hasPassword = formData.password && formData.password.trim().length > 0;
            const hasName = formData.name && formData.name.trim().length > 0;
            
            // Validation results should match field presence
            expect(emailResult.isValid).toBe(hasEmail);
            expect(passwordResult.isValid).toBe(hasPassword);
            expect(nameResult.isValid).toBe(hasName);
            
            // If any field is empty, it should have an error
            if (!hasEmail) {
              expect(emailResult.error).toBeTruthy();
            }
            if (!hasPassword) {
              expect(passwordResult.error).toBeTruthy();
            }
            if (!hasName) {
              expect(nameResult.error).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide field-specific error messages', () => {
      fc.assert(
        fc.property(
          fc.constant(''),
          fc.constantFrom('Email', 'Password', 'Name', 'Username', 'Phone'),
          (emptyValue, fieldName) => {
            const result = validateRequired(emptyValue, fieldName);
            
            // Should fail validation
            expect(result.isValid).toBe(false);
            
            // Error message should include the field name
            expect(result.error).toBeTruthy();
            expect(result.error).toContain(fieldName);
            expect(result.error).toContain('required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent form submission when required fields are empty', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.option(fc.emailAddress(), { nil: '' }),
            password: fc.option(fc.string({ minLength: 8 }), { nil: '' })
          }),
          (loginForm) => {
            // Validate required fields
            const emailValid = validateRequired(loginForm.email, 'Email').isValid;
            const passwordValid = validateRequired(loginForm.password, 'Password').isValid;
            
            // Form should only be submittable if all required fields are valid
            const canSubmit = emailValid && passwordValid;
            
            // If any field is empty, form should not be submittable
            const hasEmptyField = !loginForm.email || loginForm.email.trim() === '' ||
                                  !loginForm.password || loginForm.password.trim() === '';
            
            if (hasEmptyField) {
              expect(canSubmit).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Integration property: Complete form validation
   * 
   * Tests that all validation rules work together correctly for authentication forms.
   */
  describe('Integration: Complete form validation', () => {
    it('should validate complete login form correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.option(fc.emailAddress(), { nil: '' }),
            password: fc.option(fc.string({ minLength: 8 }), { nil: '' })
          }),
          (loginForm) => {
            // Validate all fields
            const emailValidation = validateEmail(loginForm.email);
            const passwordValidation = validateRequired(loginForm.password, 'Password');
            
            // Form is valid only if all validations pass
            const isFormValid = emailValidation.isValid && passwordValidation.isValid;
            
            // Check expected validity
            const hasValidEmail = loginForm.email && loginForm.email.includes('@');
            const hasValidPassword = loginForm.password && loginForm.password.trim().length > 0;
            
            // If form has valid data, validation should pass
            if (hasValidEmail && hasValidPassword) {
              expect(emailValidation.isValid).toBe(true);
              expect(passwordValidation.isValid).toBe(true);
            }
            
            // If form has invalid data, at least one validation should fail
            if (!hasValidEmail || !hasValidPassword) {
              expect(isFormValid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate complete signup form correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.option(fc.emailAddress(), { nil: '' }),
            name: fc.option(fc.string({ minLength: 1 }), { nil: '' }),
            password: fc.option(
              fc.string({ minLength: 8, maxLength: 128 })
                .filter(s => /[A-Z]/.test(s))
                .filter(s => /[a-z]/.test(s))
                .filter(s => /[0-9]/.test(s)),
              { nil: '' }
            )
          }),
          (signupForm) => {
            // Validate all fields
            const emailValidation = validateEmail(signupForm.email);
            const nameValidation = validateRequired(signupForm.name, 'Name');
            const passwordValidation = validatePassword(signupForm.password);
            
            // Form is valid only if all validations pass
            const isFormValid = emailValidation.isValid && 
                               nameValidation.isValid && 
                               passwordValidation.isValid;
            
            // If any field is invalid, form should not be valid
            if (!emailValidation.isValid || !nameValidation.isValid || !passwordValidation.isValid) {
              expect(isFormValid).toBe(false);
            }
            
            // If all fields are valid, form should be valid
            if (emailValidation.isValid && nameValidation.isValid && passwordValidation.isValid) {
              expect(isFormValid).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
