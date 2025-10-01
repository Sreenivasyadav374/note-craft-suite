# Google Sign-In Setup Guide

This guide will help you configure Google OAuth authentication for your application.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type (or Internal if using Google Workspace)
3. Fill in the required information:
   - App name: Your app name (e.g., "NoteCraft Premium")
   - User support email: Your email
   - Developer contact information: Your email
4. Under **Authorized domains**, add:
   - Your production domain (e.g., `yourdomain.com`)
   - Your Lovable preview domain (e.g., `yourproject.lovable.app`)
5. Configure the following OAuth scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Save and continue

## Step 3: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth Client ID**
3. Choose **Web application** as the application type
4. Configure the following:
   
   **Authorized JavaScript origins:**
   - `http://localhost:5173` (for local development)
   - `https://yourproject.lovable.app` (your Lovable preview URL)
   - `https://yourdomain.com` (your production domain)
   
   **Authorized redirect URIs:**
   - `http://localhost:5173` (for local development)
   - `https://yourproject.lovable.app` (your Lovable preview URL)
   - `https://yourdomain.com` (your production domain)

5. Click **Create**
6. Copy your **Client ID** - you'll need this next

## Step 4: Add Client ID to Your Application

1. Open `frontend/src/App.tsx`
2. Find this line:
   ```typescript
   const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID from Step 3

## Step 5: Deploy Backend Changes

Your backend now includes a new `/api/auth/google` endpoint that handles Google OAuth tokens.

Make sure to redeploy your backend if you're using a hosted service like Vercel or Heroku.

## Step 6: Test the Integration

1. Click the profile button in your app header
2. The Profile Drawer will open
3. If not signed in, you'll see a "Sign in with Google" button
4. Click it and complete the Google sign-in flow
5. Upon success, you'll be signed in and see your Google profile information

## How It Works

1. **Frontend**: Uses `@react-oauth/google` library to handle Google's OAuth flow
2. **Google Sign-In Button**: Shows when user is not authenticated
3. **Token Exchange**: Google returns a JWT credential token
4. **Backend Verification**: Your backend receives the token and validates it
5. **User Creation**: Creates or finds user in your database
6. **Session**: Returns your app's JWT token for authenticated requests
7. **Profile Storage**: Stores user's name, email, and profile picture in localStorage and context

## Security Notes

⚠️ **Important**: In production, you should verify Google's JWT token signature using Google's public keys. The current implementation decodes the token without full verification for simplicity.

To add proper verification, install `google-auth-library`:
```bash
npm install google-auth-library
```

Then update `backend/src/routes/google-auth.ts` to use:
```typescript
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
```

## Troubleshooting

### "Sign in with Google button doesn't appear"
- Check that your Client ID is correctly set in `App.tsx`
- Ensure you're not already signed in

### "Invalid Google credential" error
- Verify your authorized domains in Google Cloud Console
- Check that the Client ID matches what you set in the code
- Ensure your redirect URIs are correctly configured

### "Authentication failed" error
- Check backend logs for detailed error messages
- Verify MongoDB connection is working
- Ensure the backend endpoint `/api/auth/google` is accessible

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google Package](https://www.npmjs.com/package/@react-oauth/google)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
