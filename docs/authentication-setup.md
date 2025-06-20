# Authentication Setup

This application now includes NextAuth.js for authentication with a setup flow for the first user.

## Features

- **First User Setup**: When no users exist in the database, the application automatically redirects to a setup screen where the first administrator account can be created.
- **Secure Authentication**: Uses bcrypt for password hashing and NextAuth.js for session management.
- **Protected Routes**: All application routes are protected and require authentication.
- **Automatic Redirects**: Unauthenticated users are redirected to the appropriate screen (setup or sign-in).

## Initial Setup Process

1. Start the application: `npm run dev`
2. Navigate to `http://localhost:9002`
3. You'll be automatically redirected to `/setup` if no users exist
4. Fill out the form to create the first administrator account
5. After successful registration, you'll be automatically signed in and redirected to the dashboard

## Environment Variables

Make sure to set the following environment variables in your `.env` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:9002"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-replace-in-production"
```

⚠️ **Important**: Replace the `NEXTAUTH_SECRET` with a secure random string in production!

## API Routes

- `/api/auth/[...nextauth]` - NextAuth.js authentication endpoints
- `/api/auth/register` - User registration (only works when no users exist)
- `/api/auth/setup-check` - Checks if this is the first user setup

## Pages

- `/setup` - First user registration page
- `/auth/signin` - Sign-in page for existing users
- All other routes are protected and require authentication

## Database Schema

The authentication system uses the following Prisma models:

- `User` - User accounts with email/password authentication
- `Account` - OAuth account linking (for future OAuth providers)
- `Session` - User sessions
- `VerificationToken` - Email verification tokens (for future use)

## Security Features

- Password hashing with bcrypt
- JWT-based sessions
- Middleware-based route protection
- CSRF protection via NextAuth.js
- Secure session cookies
