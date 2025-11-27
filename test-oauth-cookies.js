const googleOAuth = require('./src/services/googleOAuth.service');

/**
 * Test script to verify OAuth authentication and cookie generation
 */
async function testOAuthCookies() {
    try {
        console.log('=== Testing OAuth Cookie Generation ===\n');

        // Check if OAuth is authenticated
        const isAuth = googleOAuth.isAuthenticated();
        console.log('1. OAuth Authentication Status:', isAuth ? '✓ Authenticated' : '✗ Not Authenticated');

        if (!isAuth) {
            console.log('\n⚠ OAuth not configured. Please run the OAuth setup first.');
            console.log('   You can use: node oauth-helper.js');
            process.exit(1);
        }

        // Test token validity
        console.log('\n2. Testing token validity...');
        const tokens = await googleOAuth.ensureValidTokens();
        console.log('   ✓ Tokens are valid');
        console.log('   - Access token expires:', new Date(tokens.expiry_date).toISOString());

        // Generate cookies
        console.log('\n3. Generating YouTube cookies...');
        const cookies = await googleOAuth.getYtdlpCookies();
        console.log('   ✓ Cookies generated');
        console.log('   - Cookie content length:', cookies.length, 'bytes');

        // Show cookie preview
        const lines = cookies.split('\n');
        console.log('   - Cookie lines:', lines.length);
        console.log('\n4. Cookie Preview (first 5 lines):');
        lines.slice(0, 5).forEach(line => console.log('   ', line));

        // Save to temp file
        console.log('\n5. Saving cookie file...');
        const cookieFile = './temp-youtube-downloads/test-oauth-cookies.txt';
        await googleOAuth.saveCookiesToFile(cookieFile);
        console.log('   ✓ Cookie file saved to:', cookieFile);

        console.log('\n=== Test Complete ===');
        console.log('✓ OAuth cookies are ready for use with yt-dlp');
        console.log('\nYou can now test downloading a YouTube video with high quality.');

    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testOAuthCookies();
