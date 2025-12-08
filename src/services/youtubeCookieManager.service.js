const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const config = require('../config/config');

// Initialize AWS SES client (using aws-sdk v2 which is already installed)
AWS.config.update({
  region: config.aws.region,
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
});
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

// Cookie file path
const COOKIE_FILE_PATH = config.youtube?.cookieFile || path.resolve(process.cwd(), 'youtube-cookies.txt');

// Track notification state to avoid spam
let lastNotificationSent = null;
const NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown between notifications

/**
 * Check if YouTube cookies are expired based on error message
 * @param {string} errorMessage - Error message from yt-dlp
 * @returns {boolean}
 */
const isCookieExpiredError = (errorMessage) => {
  const expiredIndicators = [
    'Sign in to confirm you\'re not a bot',
    'cookies',
    'authentication',
    'sign in',
    'login required',
    'Please sign in',
    'bot detection',
  ];
  
  const lowerError = (errorMessage || '').toLowerCase();
  return expiredIndicators.some(indicator => lowerError.includes(indicator.toLowerCase()));
};

/**
 * Send cookie expiry notification email via AWS SES
 * @param {string} errorMessage - The error message from YouTube
 */
const sendCookieExpiryNotification = async (errorMessage) => {
  // Check cooldown to avoid spam
  const now = Date.now();
  if (lastNotificationSent && (now - lastNotificationSent) < NOTIFICATION_COOLDOWN_MS) {
    console.log('[Cookie Manager] Notification cooldown active, skipping email');
    return;
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || config.email?.from;
  if (!adminEmail) {
    console.error('[Cookie Manager] No admin email configured for notifications');
    return;
  }

  const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
  const updateEndpoint = `${serverUrl}/v1/youtube-cookies/update`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .alert h2 { color: #dc2626; margin-top: 0; }
    .steps { background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .steps h3 { margin-top: 0; color: #1f2937; }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin-bottom: 10px; }
    .code { background: #1f2937; color: #10b981; padding: 12px; border-radius: 4px; font-family: monospace; overflow-x: auto; }
    .endpoint { background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .endpoint h3 { color: #1d4ed8; margin-top: 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert">
      <h2>⚠️ YouTube Cookie Expired!</h2>
      <p>The YouTube download service encountered an authentication error:</p>
      <div class="code">${errorMessage}</div>
    </div>

    <div class="steps">
      <h3>🔧 How to Fix (2 minutes)</h3>
      <ol>
        <li><strong>Export cookies from Firefox:</strong>
          <ul>
            <li>Install Firefox addon: <a href="https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/">cookies.txt</a></li>
            <li>Go to <a href="https://youtube.com">youtube.com</a> and ensure you're logged in</li>
            <li>Click the addon icon → "Current Site" → Copy or download</li>
          </ul>
        </li>
        <li><strong>Update cookies via API:</strong></li>
      </ol>
    </div>

    <div class="endpoint">
      <h3>📤 Update Cookies Endpoint</h3>
      <p><strong>POST</strong> ${updateEndpoint}</p>
      <p>Send the cookie content in the request body:</p>
      <div class="code">
curl -X POST "${updateEndpoint}" \\
  -H "Content-Type: text/plain" \\
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \\
  --data-binary @youtube-cookies.txt
      </div>
      <p style="margin-top: 15px;"><strong>Or use the web form:</strong></p>
      <p><a href="${serverUrl}/v1/youtube-cookies/form" class="button">Open Cookie Update Form</a></p>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      Time: ${new Date().toISOString()}<br>
      Server: ${serverUrl}
    </p>
  </div>
</body>
</html>
`;

  const textBody = `
YouTube Cookie Expired!

The YouTube download service encountered an authentication error:
${errorMessage}

How to Fix:
1. Export cookies from Firefox using the "cookies.txt" addon
2. Go to youtube.com and ensure you're logged in
3. Click the addon → "Current Site" → Copy/download

Update via API:
POST ${updateEndpoint}
curl -X POST "${updateEndpoint}" -H "Content-Type: text/plain" -H "X-Admin-Secret: YOUR_ADMIN_SECRET" --data-binary @youtube-cookies.txt

Or use the web form: ${serverUrl}/v1/youtube-cookies/form

Time: ${new Date().toISOString()}
`;

  try {
    const params = {
      Source: config.email?.from || adminEmail,
      Destination: {
        ToAddresses: [adminEmail],
      },
      Message: {
        Subject: {
          Data: '🚨 [Klass-VR] YouTube Cookies Expired - Action Required',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    };

    await ses.sendEmail(params).promise();
    lastNotificationSent = now;
    console.log('[Cookie Manager] ✓ Expiry notification sent to:', adminEmail);
  } catch (error) {
    console.error('[Cookie Manager] Failed to send SES notification:', error.message);
    
    // Fallback: Try using nodemailer if SES fails
    try {
      const emailService = require('./email.service');
      await emailService.sendEmail(adminEmail, '🚨 [Klass-VR] YouTube Cookies Expired', textBody);
      lastNotificationSent = now;
      console.log('[Cookie Manager] ✓ Expiry notification sent via SMTP to:', adminEmail);
    } catch (smtpError) {
      console.error('[Cookie Manager] SMTP fallback also failed:', smtpError.message);
    }
  }
};

/**
 * Handle YouTube download error - check if cookie expired and notify
 * @param {string} errorMessage - Error message from yt-dlp
 */
const handleYouTubeError = async (errorMessage) => {
  if (isCookieExpiredError(errorMessage)) {
    console.log('[Cookie Manager] Detected cookie expiry error');
    await sendCookieExpiryNotification(errorMessage);
    return true;
  }
  return false;
};

/**
 * Update YouTube cookies file
 * @param {string} cookieContent - New cookie file content
 * @returns {Object} - Result with success status and message
 */
const updateCookies = async (cookieContent) => {
  try {
    // Validate cookie content (basic check for Netscape format)
    if (!cookieContent || typeof cookieContent !== 'string') {
      throw new Error('Invalid cookie content');
    }

    const lines = cookieContent.trim().split('\n');
    const hasValidFormat = lines.some(line => 
      line.includes('.youtube.com') || 
      line.includes('.google.com') ||
      line.startsWith('# Netscape') ||
      line.startsWith('# HTTP Cookie')
    );

    if (!hasValidFormat) {
      throw new Error('Cookie content does not appear to be in Netscape format. Make sure to export from browser correctly.');
    }

    // Backup existing cookies
    if (fs.existsSync(COOKIE_FILE_PATH)) {
      const backupPath = `${COOKIE_FILE_PATH}.backup.${Date.now()}`;
      fs.copyFileSync(COOKIE_FILE_PATH, backupPath);
      console.log('[Cookie Manager] Backed up existing cookies to:', backupPath);
      
      // Clean up old backups (keep last 5)
      const dir = path.dirname(COOKIE_FILE_PATH);
      const backups = fs.readdirSync(dir)
        .filter(f => f.startsWith('youtube-cookies.txt.backup.'))
        .sort()
        .reverse();
      
      backups.slice(5).forEach(backup => {
        fs.unlinkSync(path.join(dir, backup));
      });
    }

    // Write new cookies
    fs.writeFileSync(COOKIE_FILE_PATH, cookieContent);
    console.log('[Cookie Manager] ✓ Cookies updated successfully');

    // Reset notification cooldown
    lastNotificationSent = null;

    return {
      success: true,
      message: 'Cookies updated successfully',
      path: COOKIE_FILE_PATH,
      linesCount: lines.length,
    };
  } catch (error) {
    console.error('[Cookie Manager] Failed to update cookies:', error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get cookie file status
 * @returns {Object} - Cookie file status
 */
const getCookieStatus = () => {
  try {
    if (!fs.existsSync(COOKIE_FILE_PATH)) {
      return {
        exists: false,
        path: COOKIE_FILE_PATH,
        message: 'Cookie file does not exist',
      };
    }

    const stats = fs.statSync(COOKIE_FILE_PATH);
    const content = fs.readFileSync(COOKIE_FILE_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

    return {
      exists: true,
      path: COOKIE_FILE_PATH,
      size: stats.size,
      modifiedAt: stats.mtime,
      cookieCount: lines.length,
      lastNotificationSent: lastNotificationSent ? new Date(lastNotificationSent).toISOString() : null,
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
    };
  }
};

/**
 * Test if current cookies are valid by making a test request
 * @returns {Promise<Object>} - Test result
 */
const testCookies = async () => {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execPromise = promisify(exec);

  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  try {
    let cookieArg = '';
    if (fs.existsSync(COOKIE_FILE_PATH)) {
      cookieArg = `--cookies "${COOKIE_FILE_PATH}"`;
    }

    const cmd = `yt-dlp ${cookieArg} --dump-json --no-playlist --no-warnings "${testUrl}"`;
    const { stdout } = await execPromise(cmd, { timeout: 30000 });
    
    const info = JSON.parse(stdout);
    return {
      valid: true,
      message: 'Cookies are working',
      videoTitle: info.title,
    };
  } catch (error) {
    const isExpired = isCookieExpiredError(error.message);
    return {
      valid: false,
      expired: isExpired,
      message: isExpired ? 'Cookies are expired' : 'Test failed',
      error: error.message,
    };
  }
};

module.exports = {
  isCookieExpiredError,
  sendCookieExpiryNotification,
  handleYouTubeError,
  updateCookies,
  getCookieStatus,
  testCookies,
  COOKIE_FILE_PATH,
};
