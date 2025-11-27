#!/usr/bin/env node

/**
 * Test script for Google OAuth functionality
 * Run with: node test-oauth.js
 */

const googleOAuth = require('./src/services/googleOAuth.service');
const config = require('./src/config/config');

async function testOAuth() {
  console.log('=== Google OAuth Test ===\n');

  // 1. Check configuration
  console.log('1. Checking configuration...');
  console.log('Client ID:', config.google?.clientId ? '✓ Set' : '✗ Missing');
  console.log('Client Secret:', config.google?.clientSecret ? '✓ Set' : '✗ Missing');
  console.log('Redirect URI:', config.google?.redirectUri || '✗ Missing');
  console.log();

  // 2. Check authentication status
  console.log('2. Checking authentication status...');
  const isAuthenticated = googleOAuth.isAuthenticated();
  console.log('Authenticated:', isAuthenticated ? '✓ Yes' : '✗ No');
  console.log();

  // 3. Load tokens if available
  if (isAuthenticated) {
    console.log('3. Loading tokens...');
    try {
      const tokens = googleOAuth.loadTokens();
      if (tokens) {
        console.log('Token Type:', tokens.token_type);
        console.log('Scope:', tokens.scope);
        console.log('Expires:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'No expiry');
        console.log('Has Refresh Token:', tokens.refresh_token ? '✓ Yes' : '✗ No');
      }
    } catch (error) {
      console.log('Error loading tokens:', error.message);
    }
    console.log();
  }

  // 4. Generate auth URL if not authenticated
  if (!isAuthenticated) {
    console.log('4. Generating authorization URL...');
    try {
      const authUrl = googleOAuth.getAuthUrl();
      console.log('Auth URL:', authUrl);
      console.log();
      console.log('To authenticate:');
      console.log('1. Open the URL above in your browser');
      console.log('2. Grant permission');
      console.log('3. Copy the "code" parameter from the callback URL');
      console.log('4. Call: curl "http://localhost:3000/auth/google/callback?code=YOUR_CODE"');
    } catch (error) {
      console.log('Error generating auth URL:', error.message);
    }
  } else {
    // 5. Test token refresh if authenticated
    console.log('4. Testing token refresh...');
    try {
      await googleOAuth.ensureValidTokens();
      console.log('✓ Token refresh successful');
    } catch (error) {
      console.log('✗ Token refresh failed:', error.message);
    }
    console.log();

    // 6. Test cookie generation
    console.log('5. Testing cookie generation...');
    try {
      const cookies = await googleOAuth.getYtdlpCookies();
      console.log('✓ Cookie generation successful');
      console.log('Cookie length:', cookies.length, 'characters');
    } catch (error) {
      console.log('✗ Cookie generation failed:', error.message);
    }
  }

  console.log('\n=== Test Complete ===');
}

// Run test
testOAuth().catch(console.error);
