const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

/**
 * Test yt-dlp download with different methods
 */
async function testDownload() {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    console.log('=== Testing yt-dlp Download Methods (Updated) ===\n');
    console.log('Test URL:', testUrl);
    console.log();

    // Test 1: Web Client with Cookies (Simulated)
    // We'll use firefox cookies if available, or just check formats
    console.log('1. Testing Web Client (should be 2nd priority)...');
    try {
        // Try to find a browser with cookies first
        const browsers = ['chrome', 'firefox', 'edge', 'safari'];
        let cookieArg = '';
        for (const b of browsers) {
            try {
                await execPromise(`yt-dlp --cookies-from-browser ${b} --dump-json --no-playlist "${testUrl}"`, { timeout: 10000 });
                cookieArg = `--cookies-from-browser ${b}`;
                console.log(`   Using ${b} cookies`);
                break;
            } catch (e) { }
        }

        if (!cookieArg) {
            console.log('   ⚠ No browser cookies found, testing without cookies');
        }

        const { stdout } = await execPromise(
            `yt-dlp ${cookieArg} --extractor-args "youtube:player_client=web" -F "${testUrl}"`,
            { timeout: 30000 }
        );

        const lines = stdout.split('\n');
        const highQuality = lines.filter(line => line.includes('1080p') || line.includes('2160p') || line.includes('720p'));

        if (highQuality.length > 0) {
            console.log('   ✓ High quality formats available:');
            highQuality.forEach(line => console.log('   ', line.trim()));
        } else {
            console.log('   ⚠ No high quality formats found with Web Client');
        }
        console.log();
    } catch (error) {
        console.error('   ✗ Failed:', error.message);
    }

    // Test 2: iOS Client
    console.log('2. Testing iOS Client (should be 3rd priority)...');
    try {
        const { stdout } = await execPromise(
            `yt-dlp --extractor-args "youtube:player_client=ios" -F "${testUrl}"`,
            { timeout: 30000 }
        );

        const lines = stdout.split('\n');
        const highQuality = lines.filter(line => line.includes('1080p') || line.includes('2160p') || line.includes('720p'));

        if (highQuality.length > 0) {
            console.log('   ✓ High quality formats available:');
            highQuality.forEach(line => console.log('   ', line.trim()));
        } else {
            console.log('   ⚠ No high quality formats found with iOS Client');
        }
        console.log();
    } catch (error) {
        console.error('   ✗ Failed (likely needs PO Token):', error.message.split('\n')[0]);
    }

    console.log('=== Test Complete ===');
}

testDownload().catch(console.error);
