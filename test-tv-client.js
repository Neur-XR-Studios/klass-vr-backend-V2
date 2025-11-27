const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

async function testTvClientWithRemoteComponents() {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    console.log('=== Testing TV Client with Remote Components ===\n');

    // Try to find a browser with cookies
    const browsers = ['chrome', 'firefox', 'edge', 'safari'];
    let cookieArg = '';
    for (const b of browsers) {
        try {
            await execPromise(`yt-dlp --cookies-from-browser ${b} --dump-json --no-playlist "${testUrl}"`, { timeout: 10000 });
            cookieArg = `--cookies-from-browser ${b}`;
            console.log(`Using ${b} cookies`);
            break;
        } catch (e) { }
    }

    if (!cookieArg) {
        console.log('⚠ No browser cookies found, testing without cookies (might fail)');
    }

    console.log('\nRunning yt-dlp with --remote-components ejs:github...');
    try {
        const { stdout } = await execPromise(
            `yt-dlp ${cookieArg} --remote-components ejs:github --extractor-args "youtube:player_client=tv_embedded" -F "${testUrl}"`,
            { timeout: 60000 }
        );

        const lines = stdout.split('\n');
        const highQuality = lines.filter(line => line.includes('1080p') || line.includes('2160p') || line.includes('720p'));

        if (highQuality.length > 0) {
            console.log('✓ High quality formats available:');
            highQuality.forEach(line => console.log('   ', line.trim()));
        } else {
            console.log('⚠ No high quality formats found');
            console.log('Full output:\n', stdout);
        }
    } catch (error) {
        console.error('✗ Failed:', error.message);
    }
}

testTvClientWithRemoteComponents();
