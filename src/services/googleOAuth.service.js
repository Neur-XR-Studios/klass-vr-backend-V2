const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class GoogleOAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google?.clientId,
      config.google?.clientSecret,
      config.google?.redirectUri
    );
    
    this.tokensPath = path.resolve(process.cwd(), 'google-oauth-tokens.json');
    this.scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtubepartner'
    ];
  }

  /**
   * Load saved tokens from file
   */
  loadTokens() {
    try {
      if (fs.existsSync(this.tokensPath)) {
        const tokens = JSON.parse(fs.readFileSync(this.tokensPath, 'utf8'));
        this.oauth2Client.setCredentials(tokens);
        return tokens;
      }
    } catch (error) {
      console.error('[Google OAuth] Error loading tokens:', error.message);
    }
    return null;
  }

  /**
   * Save tokens to file
   */
  saveTokens(tokens) {
    try {
      fs.writeFileSync(this.tokensPath, JSON.stringify(tokens, null, 2));
      console.log('[Google OAuth] Tokens saved successfully');
    } catch (error) {
      console.error('[Google OAuth] Error saving tokens:', error.message);
    }
  }

  /**
   * Get authorization URL for user to grant access
   */
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.saveTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('[Google OAuth] Error exchanging code for tokens:', error.message);
      throw error;
    }
  }

  /**
   * Check if tokens are valid and refresh if needed
   */
  async ensureValidTokens() {
    const tokens = this.loadTokens();
    
    if (!tokens) {
      throw new Error('No OAuth tokens found. Please authenticate first.');
    }

    // Check if token is expired or will expire within 5 minutes
    const now = Date.now();
    const expiryTime = (tokens.expiry_date || 0) - 5 * 60 * 1000; // 5 minutes buffer

    if (now >= expiryTime) {
      if (tokens.refresh_token) {
        try {
          console.log('[Google OAuth] Refreshing access token...');
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          this.oauth2Client.setCredentials(credentials);
          this.saveTokens(credentials);
          return credentials;
        } catch (error) {
          console.error('[Google OAuth] Error refreshing token:', error.message);
          throw new Error('Token refresh failed. Please re-authenticate.');
        }
      } else {
        throw new Error('No refresh token available. Please re-authenticate.');
      }
    }

    return tokens;
  }

  /**
   * Get authenticated OAuth2 client
   */
  async getAuthenticatedClient() {
    await this.ensureValidTokens();
    return this.oauth2Client;
  }

  /**
   * Get cookies string for yt-dlp from OAuth tokens
   * Creates a comprehensive cookie file with all necessary authentication cookies
   */
  async getYtdlpCookies() {
    try {
      const client = await this.getAuthenticatedClient();
      const tokens = client.credentials;
      
      // Calculate expiration timestamp (1 hour from now)
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 3600;
      
      // Create comprehensive Netscape cookie format that works with yt-dlp
      // Include all essential cookies for YouTube authentication
      const cookies = [
        '# Netscape HTTP Cookie File',
        '# This is a generated file! Do not edit.',
        '',
        `# YouTube OAuth cookies - Generated at ${new Date().toISOString()}`,
        `# Access Token: ${tokens.access_token.substring(0, 20)}...`,
        '',
        // Core authentication cookies for youtube.com
        `.youtube.com\tTRUE\t/\tTRUE\t${expiryTimestamp}\t__Secure-3PSID\t${tokens.access_token}`,
        `.youtube.com\tTRUE\t/\tTRUE\t${expiryTimestamp}\tSAPISID\t${tokens.access_token}`,
        `.youtube.com\tTRUE\t/\tTRUE\t${expiryTimestamp}\t__Secure-3PAPISID\t${tokens.access_token}`,
        `.youtube.com\tTRUE\t/\tFALSE\t${expiryTimestamp}\tSID\t${tokens.access_token}`,
        `.youtube.com\tTRUE\t/\tFALSE\t${expiryTimestamp}\tHSID\t${tokens.access_token}`,
        `.youtube.com\tTRUE\t/\tFALSE\t${expiryTimestamp}\tSSID\t${tokens.access_token}`,
        '',
        // Core authentication cookies for google.com
        `.google.com\tTRUE\t/\tTRUE\t${expiryTimestamp}\t__Secure-3PSID\t${tokens.access_token}`,
        `.google.com\tTRUE\t/\tTRUE\t${expiryTimestamp}\tSAPISID\t${tokens.access_token}`,
        `.google.com\tTRUE\t/\tTRUE\t${expiryTimestamp}\t__Secure-3PAPISID\t${tokens.access_token}`,
        `.google.com\tTRUE\t/\tFALSE\t${expiryTimestamp}\tSID\t${tokens.access_token}`,
        `.google.com\tTRUE\t/\tFALSE\t${expiryTimestamp}\tHSID\t${tokens.access_token}`,
        `.google.com\tTRUE\t/\tFALSE\t${expiryTimestamp}\tSSID\t${tokens.access_token}`,
      ].join('\n');

      return cookies;
    } catch (error) {
      console.error('[Google OAuth] Error generating cookies:', error.message);
      throw error;
    }
  }
  
  /**
   * Save cookies to a file for yt-dlp
   * @param {string} filepath - Path to save cookie file
   */
  async saveCookiesToFile(filepath) {
    try {
      const cookies = await this.getYtdlpCookies();
      fs.writeFileSync(filepath, cookies);
      console.log('[Google OAuth] Cookie file saved to:', filepath);
      return filepath;
    } catch (error) {
      console.error('[Google OAuth] Error saving cookie file:', error.message);
      throw error;
    }
  }

  /**
   * Revoke tokens
   */
  async revokeTokens() {
    try {
      const tokens = this.loadTokens();
      if (tokens && tokens.access_token) {
        await this.oauth2Client.revokeToken(tokens.access_token);
      }
      
      // Remove tokens file
      if (fs.existsSync(this.tokensPath)) {
        fs.unlinkSync(this.tokensPath);
      }
      
      console.log('[Google OAuth] Tokens revoked successfully');
    } catch (error) {
      console.error('[Google OAuth] Error revoking tokens:', error.message);
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    const tokens = this.loadTokens();
    return tokens && tokens.access_token;
  }
}

module.exports = new GoogleOAuthService();
