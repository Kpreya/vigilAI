# NextAuth.js v5 Configuration

This directory contains the NextAuth.js v5 authentication configuration for the VigilAI Platform.

## Files

### `auth.ts`
Main NextAuth.js configuration file that exports:
- `handlers`: HTTP handlers for GET and POST requests
- `signIn`: Function to sign in a user
- `signOut`: Function to sign out a user
- `auth`: Function to get the current session

### `auth-helpers.ts`
Helper functions for authentication:
- `getCurrentUser()`: Get the current authenticated user
- `requireAuth()`: Require authentication (throws error if not authenticated)
- `requireApplicationAccess()`: Check if user has access to a specific application

## Configuration

### Providers

1. **Credentials Provider**: Email/password authentication
   - Validates credentials against the database
   - Uses bcrypt for password hashing

2. **GitHub OAuth**: GitHub authentication
   - Requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` environment variables

3. **Google OAuth**: Google authentication
   - Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables

### Session Strategy

- **Strategy**: JWT (JSON Web Tokens)
- **Max Age**: 30 days
- **Adapter**: Prisma Adapter for database persistence

### Custom Pages

- Sign In: `/login`
- Sign Out: `/login`
- Error: `/login`
- New User: `/dashboard`

### Callbacks

#### JWT Callback
- Adds user ID to the JWT token
- Handles OAuth account linking

#### Session Callback
- Adds user ID to the session object
- Makes user ID available in `session.user.id`

#### Redirect Callback
- Handles redirects after authentication
- Allows relative URLs and same-origin URLs

## Usage

### In Server Components

```typescript
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  
  if (!session) {
    return <div>Not authenticated</div>;
  }
  
  return <div>Hello {session.user.name}</div>;
}
```

### In API Routes

```typescript
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await requireAuth();
    // User is authenticated
    return Response.json({ user });
  } catch (error) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

### In Client Components

```typescript
"use client";

import { useSession } from "next-auth/react";

export default function ClientComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  
  if (!session) {
    return <div>Not authenticated</div>;
  }
  
  return <div>Hello {session.user.name}</div>;
}
```

### Sign In

```typescript
import { signIn } from "@/lib/auth";

// Credentials sign in
await signIn("credentials", {
  email: "user@example.com",
  password: "password",
  redirectTo: "/dashboard",
});

// OAuth sign in
await signIn("github", { redirectTo: "/dashboard" });
await signIn("google", { redirectTo: "/dashboard" });
```

### Sign Out

```typescript
import { signOut } from "@/lib/auth";

await signOut({ redirectTo: "/login" });
```

## Environment Variables

Required environment variables in `.env`:

```bash
# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Generate a secret with:
```bash
openssl rand -base64 32
```

## Middleware

The `middleware.ts` file in the root directory protects routes:
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from auth pages
- Allows public routes and API routes

## Database Schema

NextAuth.js uses the following Prisma models:
- `User`: User accounts
- `Account`: OAuth accounts
- `Session`: User sessions (when using database strategy)
- `VerificationToken`: Email verification tokens

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 30-day expiration
- Secure session management
- CSRF protection (built-in)
- OAuth account linking
- Secure redirect handling

## Next Steps

1. Create sign-up API route (Task 3.2)
2. Implement OAuth providers (Task 3.3)
3. Implement password reset flow (Task 3.4)
4. Create authentication pages (Task 17)
