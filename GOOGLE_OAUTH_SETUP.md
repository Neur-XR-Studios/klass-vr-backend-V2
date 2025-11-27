# Google OAuth for YouTube Downloads

This implementation provides a permanent solution for YouTube video downloads using Google OAuth tokens instead of expired cookies.

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Download the credentials JSON file

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Google OAuth Credentials
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Optional: Traditional cookie fallback (comment out if using OAuth only)
# YOUTUBE_COOKIE=chrome
```

### 3. Authentication Flow

1. **Get Authorization URL**
   ```bash
   GET http://localhost:3000/auth/google/url
   ```

2. **User Authorization**
   - Open the returned `authUrl` in browser
   - Grant permission to YouTube Data API
   - You'll be redirected to callback URL

3. **Handle Callback**
   ```bash
   GET http://localhost:3000/auth/google/callback?code=your_auth_code
   ```

4. **Check Status**
   ```bash
   GET http://localhost:3000/auth/google/status
   ```

## API Endpoints

### GET /auth/google/url
Returns Google OAuth authorization URL.

**Response:**
```json
{
  "success": true,
  "message": "Google OAuth authorization URL generated",
  "data": {
    "authUrl": "https://accounts.google.com/oauth/authorize?...",
    "authenticated": false
  }
}
```

### GET /auth/google/callback
Handles OAuth callback and exchanges code for tokens.

**Query Parameters:**
- `code` (required): Authorization code from Google
- `state` (optional): State parameter for security
- `error`: Error if authorization failed

**Response:**
```json
{
  "success": true,
  "message": "Successfully authenticated with Google OAuth",
  "data": {
    "authenticated": true,
    "tokenType": "Bearer",
    "scope": "https://www.googleapis.com/auth/youtube.readonly",
    "expiryDate": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /auth/google/status
Check current OAuth authentication status.

**Response:**
```json
{
  "success": true,
  "message": "OAuth status retrieved",
  "data": {
    "authenticated": true,
    "tokenInfo": {
      "tokenType": "Bearer",
      "scope": "https://www.googleapis.com/auth/youtube.readonly",
      "expiryDate": "2024-01-01T00:00:00.000Z",
      "hasRefreshToken": true
    }
  }
}
```

### POST /auth/google/refresh
Manually refresh OAuth tokens.

**Response:**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "tokenType": "Bearer",
    "scope": "https://www.googleapis.com/auth/youtube.readonly",
    "expiryDate": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE /auth/google/revoke
Revoke OAuth tokens and sign out.

**Response:**
```json
{
  "success": true,
  "message": "OAuth tokens revoked successfully"
}
```

## How It Works

1. **OAuth Token Management**: The system stores OAuth tokens in `google-oauth-tokens.json`
2. **Automatic Refresh**: Tokens automatically refresh when expired (5-minute buffer)
3. **Cookie Generation**: OAuth tokens are converted to Netscape cookie format for yt-dlp
4. **Fallback Mechanism**: Falls back to traditional cookies if OAuth fails
5. **Cleanup**: Temporary cookie files are automatically cleaned up

## Benefits

- **Permanent Solution**: No more expired cookie issues
- **Automatic Refresh**: Tokens refresh automatically when needed
- **Secure**: Uses official Google OAuth flow
- **Reliable**: Better success rate for video downloads
- **Easy Setup**: One-time authentication process

## Testing

1. Start your server
2. Follow the authentication flow above
3. Test YouTube download with your existing endpoints
4. Check logs for "[YouTube Download] Using OAuth tokens for authentication"

## Troubleshooting

### "No OAuth tokens found"
- Run the authentication flow first
- Check if tokens file exists and is valid

### "Token refresh failed"
- Re-authenticate using the OAuth flow
- Check if refresh token is available

### "YouTube download failed"
- Check OAuth status: `GET /auth/google/status`
- Verify YouTube Data API is enabled
- Check redirect URI matches in Google Console

## File Structure

```
src/
├── services/
│   ├── googleOAuth.service.js     # OAuth token management
│   └── youtubeDownload.service.js # Updated to use OAuth
├── routes/
│   └── v1/
│       └── auth.route.js          # OAuth endpoints
└── config/
    └── config.js                   # OAuth configuration
```
