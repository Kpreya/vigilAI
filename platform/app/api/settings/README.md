# Settings API Endpoints

This directory contains API endpoints for managing user profile and notification preferences.

## Endpoints

### GET /api/settings/profile

Get the current user's profile information.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://example.com/avatar.jpg"
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (missing or invalid token)
- `404` - User not found
- `500` - Internal server error

---

### PATCH /api/settings/profile

Update the current user's profile information.

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "name": "John Smith",
  "image": "https://example.com/new-avatar.jpg"
}
```

**Notes:**
- Both fields are optional
- `name` can be set to `null` to clear it
- `image` can be set to `null` to clear it
- Empty strings for `name` will be converted to `null`

**Response:**
```json
{
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Smith",
    "image": "https://example.com/new-avatar.jpg"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation error (invalid data types)
- `401` - Unauthorized (missing or invalid token)
- `500` - Internal server error

---

### GET /api/settings/notifications

Get the current user's notification preferences.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "data": {
    "emailEnabled": true,
    "emailCritical": true,
    "emailHigh": true,
    "emailMedium": false,
    "emailLow": false,
    "slackEnabled": false,
    "slackWebhook": null,
    "webhookEnabled": false,
    "webhookUrl": null
  }
}
```

**Notes:**
- If preferences don't exist for the user, default preferences will be created automatically
- Default preferences: email enabled for CRITICAL and HIGH severity only

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (missing or invalid token)
- `500` - Internal server error

---

### PATCH /api/settings/notifications

Update the current user's notification preferences.

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "emailEnabled": true,
  "emailCritical": true,
  "emailHigh": false,
  "emailMedium": true,
  "emailLow": false,
  "slackEnabled": true,
  "slackWebhook": "https://hooks.slack.com/services/...",
  "webhookEnabled": false,
  "webhookUrl": null
}
```

**Notes:**
- All fields are optional - only send the fields you want to update
- Boolean fields must be `true` or `false`
- String fields can be `null` to clear them
- If preferences don't exist, they will be created with the provided values (upsert)

**Response:**
```json
{
  "data": {
    "emailEnabled": true,
    "emailCritical": true,
    "emailHigh": false,
    "emailMedium": true,
    "emailLow": false,
    "slackEnabled": true,
    "slackWebhook": "https://hooks.slack.com/services/...",
    "webhookEnabled": false,
    "webhookUrl": null
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation error (invalid data types)
- `401` - Unauthorized (missing or invalid token)
- `500` - Internal server error

---

## Testing

Run the test script to verify all endpoints:

```bash
cd platform
npx tsx scripts/test-settings.ts
```

The test script will:
1. Login with test credentials
2. Test GET /api/settings/profile
3. Test PATCH /api/settings/profile
4. Test GET /api/settings/notifications
5. Test PATCH /api/settings/notifications

## Implementation Details

### Authentication

All endpoints use JWT token authentication:
- Token must be provided in the `Authorization` header as `Bearer <token>`
- Token is verified using the `JWT_SECRET` or `NEXTAUTH_SECRET` environment variable
- Invalid or expired tokens return a 401 error

### Database

- Profile data is stored in the `User` table
- Notification preferences are stored in the `NotificationPreference` table
- Preferences have a one-to-one relationship with users
- Default preferences are created automatically on first GET request if they don't exist

### Validation

**Profile Updates:**
- `name` must be a string (or null)
- `image` must be a string (or null)
- Empty strings for `name` are converted to `null`

**Notification Updates:**
- Boolean fields must be actual booleans
- String fields must be strings (or null)
- Invalid types return a 400 error with a descriptive message

### Error Handling

All endpoints follow consistent error response format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid authentication
- `VALIDATION_ERROR` - Invalid request data
- `USER_NOT_FOUND` - User doesn't exist
- `INTERNAL_ERROR` - Server error
