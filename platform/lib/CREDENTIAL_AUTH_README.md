# Credential Authentication Implementation

This document describes the credential-based authentication implementation for the VigilAI Platform.

## Overview

The platform implements secure email/password authentication with the following features:

- **Password Hashing**: Passwords are hashed using bcrypt with 12 rounds
- **Password Validation**: Strong password requirements enforced
- **User Registration**: Secure signup API endpoint
- **User Login**: Handled by NextAuth.js Credentials provider

## Password Requirements

All passwords must meet the following criteria:

- Minimum 8 characters long
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}; ':"\\|,.<>/?)

## API Endpoints

### Sign Up

**Endpoint**: `POST /api/auth/signup`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe" // optional
}
```

**Success Response** (201):
```json
{
  "message": "User created successfully",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:

- **400 Bad Request** - Validation failed:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

- **400 Bad Request** - Weak password:
```json
{
  "error": "Password does not meet requirements",
  "details": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

- **409 Conflict** - User already exists:
```json
{
  "error": "User already exists",
  "details": [
    {
      "field": "email",
      "message": "An account with this email already exists"
    }
  ]
}
```

- **500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error",
  "details": [
    {
      "message": "An unexpected error occurred during signup"
    }
  ]
}
```

### Sign In

**Endpoint**: Handled by NextAuth.js at `/api/auth/signin`

Sign in is managed by NextAuth.js using the Credentials provider configured in `lib/auth.ts`.

**Usage with NextAuth**:
```typescript
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: 'user@example.com',
  password: 'SecurePass123!',
  redirect: false,
});

if (result?.error) {
  // Handle error
  console.error('Sign in failed:', result.error);
} else {
  // Sign in successful
  console.log('Signed in successfully');
}
```

## Security Features

### Password Hashing

Passwords are hashed using bcrypt with 12 rounds (cost factor). This provides strong protection against brute-force attacks while maintaining reasonable performance.

```typescript
import { hashPassword } from '@/lib/password-validation';

const hashedPassword = await hashPassword('SecurePass123!');
// Returns: $2a$12$...
```

### Password Validation

The `validatePassword` function checks all password requirements and returns detailed error messages:

```typescript
import { validatePassword } from '@/lib/password-validation';

const result = validatePassword('weak');
// Returns:
// {
//   isValid: false,
//   errors: [
//     'Password must be at least 8 characters long',
//     'Password must contain at least one uppercase letter',
//     'Password must contain at least one number',
//     'Password must contain at least one special character'
//   ]
// }
```

### Input Validation

All API inputs are validated using Zod schemas to prevent injection attacks and ensure data integrity.

### Session Management

Sessions are managed by NextAuth.js using JWT tokens with the following configuration:

- **Strategy**: JWT (stateless)
- **Max Age**: 30 days
- **Secure**: Cookies are httpOnly and secure in production
- **Token Rotation**: Automatic on session access

## Implementation Files

- `lib/password-validation.ts` - Password validation and hashing utilities
- `lib/auth.ts` - NextAuth.js configuration with Credentials provider
- `app/api/auth/signup/route.ts` - User registration endpoint
- `app/api/auth/[...nextauth]/route.ts` - NextAuth.js route handler

## Testing

Password validation is thoroughly tested in `lib/password-validation.test.ts`:

- Valid password acceptance
- Minimum length validation
- Character type requirements (uppercase, lowercase, number, special)
- Empty password rejection
- Multiple error reporting
- Password hashing and comparison
- Hash uniqueness

Run tests with:
```bash
npm test
```

## Usage Example

### Frontend Sign Up Flow

```typescript
async function handleSignUp(email: string, password: string, name?: string) {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors
      console.error('Signup failed:', data.error);
      console.error('Details:', data.details);
      return;
    }

    // User created successfully
    console.log('User created:', data.user);

    // Automatically sign in the user
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/dashboard',
    });
  } catch (error) {
    console.error('Signup error:', error);
  }
}
```

### Frontend Sign In Flow

```typescript
import { signIn } from 'next-auth/react';

async function handleSignIn(email: string, password: string) {
  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      console.error('Sign in failed:', result.error);
      return;
    }

    // Sign in successful, redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Sign in error:', error);
  }
}
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 1.1**: Users can sign up with email/password
- **Requirement 1.2**: Users can log in with email/password
- **Authentication Acceptance Criteria**:
  - Users can sign up with email/password ✓
  - Users can log in with email/password ✓
  - Sessions are secure with JWT tokens ✓
  - Passwords are hashed with bcrypt ✓
  - Password validation rules enforced ✓

## Next Steps

The following authentication features are planned for future implementation:

- OAuth providers (GitHub, Google) - Task 3.3
- Password reset flow - Task 3.4
- Email verification
- Two-factor authentication (2FA)
- Account lockout after failed attempts
- Password history to prevent reuse
