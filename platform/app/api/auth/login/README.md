# POST /api/auth/login

Authentication endpoint for user login with email and password.

## Endpoint

```
POST /api/auth/login
```

## Request Body

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Validation Rules

- **email**: Must be a valid email format
- **password**: Required, non-empty string

## Response

### Success (200 OK)

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "image": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Login successful"
}
```

### Error Responses

#### 400 Bad Request - Validation Error

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

#### 401 Unauthorized - Invalid Credentials

```json
{
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## JWT Token

The returned JWT token:
- Expires in 30 days
- Contains user ID and email in the payload
- Should be stored by the client (e.g., in localStorage)
- Should be included in subsequent API requests in the Authorization header:
  ```
  Authorization: Bearer <token>
  ```

## Implementation Details

### Security Features

1. **Password Verification**: Uses bcrypt to compare passwords securely
2. **JWT Generation**: Generates signed JWT tokens with 30-day expiration
3. **Error Handling**: Returns generic "Invalid credentials" message for both non-existent users and wrong passwords (prevents user enumeration)
4. **OAuth User Protection**: Rejects login attempts for users who only have OAuth accounts (no password set)

### Database Query

The endpoint queries the User table with the following fields:
- id
- email
- name
- password (for verification, not returned in response)
- image
- createdAt

### Environment Variables

Required environment variable:
- `JWT_SECRET` or `NEXTAUTH_SECRET`: Secret key for signing JWT tokens

## Testing

### Manual Testing

Run the test script:
```bash
npx tsx scripts/test-login.ts
```

### Test Credentials

From the seed data:
- Email: `alice@example.com`, Password: `password123`
- Email: `bob@example.com`, Password: `password123`
- Email: `charlie@example.com`, Password: `password123`

### cURL Example

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

## Frontend Integration

Example JavaScript code for the frontend:

```javascript
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store token in localStorage
      localStorage.setItem('auth_token', data.data.token);
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      // Display error message
      showError(data.error);
    }
  } catch (error) {
    showError('Network error. Please try again.');
  }
}
```

## Related Endpoints

- `POST /api/auth/signup` - Create new user account
- `GET /api/auth/me` - Get current authenticated user
- All other API endpoints require the JWT token in the Authorization header

## Requirements Validation

This endpoint satisfies **Requirement 10.1**:
> THE Backend SHALL provide POST /api/auth/login endpoint that accepts email and password and returns a JWT token

### Acceptance Criteria Met

✅ Validates email and password  
✅ Queries user from database  
✅ Verifies password with bcrypt  
✅ Generates JWT token  
✅ Returns token and user data  
