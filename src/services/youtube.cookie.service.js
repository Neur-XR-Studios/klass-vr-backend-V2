// src/services/youtube.cookie.service.js
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../config/logger');
const config = require('../config/config');

const execAsync = promisify(exec);

class YouTubeCookieService {
    constructor() {
        this.cookiePath = config.youtube.cookiePath || './youtube-cookies.txt';
        this.lockFile = `${this.cookiePath}.lock`;
        this.metadataFile = `${this.cookiePath}.meta.json`;
    }

    /**
     * Check if cookies need refresh
     * @returns {Promise<boolean>}
     */
    async needsRefresh() {
        try {
            const metadata = await fs.readFile(this.metadataFile, 'utf8');
            const { lastUpdated } = JSON.parse(metadata);
            const hoursSinceUpdate = (Date.now() - new Date(lastUpdated)) / (1000 * 60 * 60);

            // Refresh if older than 36 hours (before 48-hour expiry)
            return hoursSinceUpdate > 36;
        } catch (error) {
            // No metadata file or error reading - needs refresh
            return true;
        }
    }

    /**
     * Test if current cookies work with yt-dlp
     * @returns {Promise<boolean>}
     */
    async testCookies() {
        try {
            const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
            const { stderr } = await execAsync(
                `yt-dlp --dump-json --no-playlist "${testUrl}" --cookies "${this.cookiePath}"`,
                { timeout: 15000 }
            );

            return !stderr.includes('ERROR') && !stderr.includes('Sign in to confirm');
        } catch (error) {
            logger.warn('Cookie test failed:', error.message);
            return false;
        }
    }

    /**
     * Acquire lock to prevent concurrent refreshes
     * @param {number} timeout - Lock timeout in milliseconds
     * @returns {Promise<boolean>}
     */
    async acquireLock(timeout = 300000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                await fs.writeFile(this.lockFile, process.pid.toString(), { flag: 'wx' });
                return true;
            } catch (error) {
                try {
                    const pid = await fs.readFile(this.lockFile, 'utf8');
                    try {
                        process.kill(parseInt(pid), 0);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch {
                        await fs.unlink(this.lockFile);
                    }
                } catch {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        throw new Error('Could not acquire lock for cookie refresh');
    }

    /**
     * Release lock file
     */
    async releaseLock() {
        try {
            await fs.unlink(this.lockFile);
        } catch (error) {
            // Ignore if lock file doesn't exist
        }
    }

    /**
     * Refresh YouTube cookies using Puppeteer
     * @returns {Promise<boolean>}
     */
    async refreshCookies() {
        logger.info('Starting YouTube cookie refresh...');

        const browser = await puppeteer.launch({
            headless: 'new',
            // executablePath: config.youtube.puppeteerExecutablePath || undefined, // Allow config override or auto-detect
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });


        try {
            const page = await browser.newPage();

            await page.setUserAgent(
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            // Navigate to YouTube login
            await page.goto('https://accounts.google.com/ServiceLogin?service=youtube', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Enter email
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.type('input[type="email"]', config.youtube.email, { delay: 100 });
            await page.keyboard.press('Enter');

            // Enter password
            await page.waitForSelector('input[type="password"]', { visible: true, timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.type('input[type="password"]', config.youtube.password, { delay: 100 });
            await page.keyboard.press('Enter');

            // Wait for navigation
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

            // Check for 2FA requirement
            const url = page.url();
            if (url.includes('challenge') || url.includes('verify')) {
                throw new Error('2FA or additional verification required. Please use app password.');
            }

            // Navigate to YouTube
            await page.goto('https://www.youtube.com', { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Get and save cookies
            const cookies = await page.cookies();
            const netscapeCookies = this.convertToNetscape(cookies);

            await fs.writeFile(this.cookiePath, netscapeCookies);
            await fs.writeFile(
                this.metadataFile,
                JSON.stringify({
                    lastUpdated: new Date().toISOString(),
                    cookieCount: cookies.length
                }, null, 2)
            );

            logger.info(`YouTube cookies refreshed successfully (${cookies.length} cookies)`);
            return true;
        } catch (error) {
            logger.error('YouTube cookie refresh failed:', error);
            throw error;
        } finally {
            await browser.close();
        }
    }

    /**
     * Convert cookies to Netscape format for yt-dlp
     * @param {Array} cookies - Cookie array from Puppeteer
     * @returns {string}
     */
    convertToNetscape(cookies) {
        const header = '# Netscape HTTP Cookie File\n# This file is generated automatically. Do not edit.\n\n';

        const lines = cookies.map(cookie => {
            const domain = cookie.domain.startsWith('.') ? cookie.domain : `.${cookie.domain}`;
            const flag = cookie.domain.startsWith('.') ? 'TRUE' : 'FALSE';
            const path = cookie.path || '/';
            const secure = cookie.secure ? 'TRUE' : 'FALSE';
            const expiration = cookie.expires ? Math.floor(cookie.expires) : '0';

            return `${domain}\t${flag}\t${path}\t${secure}\t${expiration}\t${cookie.name}\t${cookie.value}`;
        });

        return header + lines.join('\n');
    }

    /**
     * Ensure cookies are fresh before use
     * @param {boolean} forceRefresh - Force refresh regardless of age
     * @returns {Promise<boolean>}
     */
    async ensureFreshCookies(forceRefresh = false) {
        if (!config.youtube.email || !config.youtube.password) {
            throw new Error('YouTube credentials not configured');
        }

        // Quick check without refresh
        if (!forceRefresh) {
            const needsRefresh = await this.needsRefresh();
            if (!needsRefresh) {
                const cookiesWork = await this.testCookies();
                if (cookiesWork) {
                    logger.debug('YouTube cookies are valid');
                    return true;
                }
            }
        }

        // Acquire lock and refresh
        try {
            await this.acquireLock();

            // Double-check after lock
            if (!forceRefresh) {
                const needsRefresh = await this.needsRefresh();
                if (!needsRefresh) {
                    const cookiesWork = await this.testCookies();
                    if (cookiesWork) {
                        logger.info('YouTube cookies were refreshed by another process');
                        return true;
                    }
                }
            }

            await this.refreshCookies();
            return true;
        } finally {
            await this.releaseLock();
        }
    }

    /**
     * Get cookie file path
     * @returns {string}
     */
    getCookiePath() {
        return this.cookiePath;
    }
}

module.exports = new YouTubeCookieService();