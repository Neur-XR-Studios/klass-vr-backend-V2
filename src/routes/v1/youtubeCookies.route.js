const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieManager = require('../../services/youtubeCookieManager.service');

const router = express.Router();

// Simple admin secret check middleware
const adminAuth = (req, res, next) => {
  const adminSecret = process.env.ADMIN_SECRET || process.env.JWT_SECRET;
  const providedSecret = req.headers['x-admin-secret'] || req.query.secret;
  
  if (!providedSecret || providedSecret !== adminSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Provide X-Admin-Secret header or ?secret= query param',
    });
  }
  next();
};

/**
 * GET /v1/youtube-cookies/status
 * Get current cookie file status
 */
router.get('/status', adminAuth, (req, res) => {
  const status = cookieManager.getCookieStatus();
  res.json({
    success: true,
    data: status,
  });
});

/**
 * GET /v1/youtube-cookies/test
 * Test if current cookies are valid
 */
router.get('/test', adminAuth, async (req, res) => {
  try {
    const result = await cookieManager.testCookies();
    res.json({
      success: result.valid,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /v1/youtube-cookies/update
 * Update cookie file with new content
 * Content-Type: text/plain (raw cookie file content)
 */
router.post('/update', adminAuth, express.text({ limit: '1mb' }), async (req, res) => {
  try {
    const cookieContent = req.body;
    
    if (!cookieContent || typeof cookieContent !== 'string' || cookieContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cookie content is required. Send raw cookie file content as text/plain body.',
      });
    }

    const result = await cookieManager.updateCookies(cookieContent);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          path: result.path,
          linesCount: result.linesCount,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /v1/youtube-cookies/upload
 * Upload cookie file via multipart form
 */
router.post('/upload', adminAuth, express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  try {
    let cookieContent = req.body;
    
    if (Buffer.isBuffer(cookieContent)) {
      cookieContent = cookieContent.toString('utf8');
    }
    
    if (!cookieContent || cookieContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cookie content is required',
      });
    }

    const result = await cookieManager.updateCookies(cookieContent);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          path: result.path,
          linesCount: result.linesCount,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /v1/youtube-cookies/form
 * Simple HTML form for updating cookies
 */
router.get('/form', (req, res) => {
  const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update YouTube Cookies - Klass-VR</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 700px;
      width: 100%;
    }
    h1 {
      color: #1f2937;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .subtitle {
      color: #6b7280;
      margin-bottom: 30px;
    }
    .steps {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .steps h3 {
      margin: 0 0 15px 0;
      color: #374151;
    }
    .steps ol {
      margin: 0;
      padding-left: 20px;
      color: #4b5563;
    }
    .steps li {
      margin-bottom: 10px;
    }
    .steps a {
      color: #3b82f6;
    }
    label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      margin-bottom: 20px;
      transition: border-color 0.2s;
    }
    input[type="password"]:focus {
      outline: none;
      border-color: #3b82f6;
    }
    textarea {
      width: 100%;
      height: 200px;
      padding: 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
      resize: vertical;
      margin-bottom: 20px;
      transition: border-color 0.2s;
    }
    textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }
    button {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }
    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .result {
      margin-top: 20px;
      padding: 16px;
      border-radius: 8px;
      display: none;
    }
    .result.success {
      background: #d1fae5;
      border: 1px solid #10b981;
      color: #065f46;
    }
    .result.error {
      background: #fee2e2;
      border: 1px solid #ef4444;
      color: #991b1b;
    }
    .status {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      color: #92400e;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍪 Update YouTube Cookies</h1>
    <p class="subtitle">Klass-VR YouTube Download Service</p>
    
    <div class="steps">
      <h3>📋 How to get cookies from Firefox:</h3>
      <ol>
        <li>Install the <a href="https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/" target="_blank">cookies.txt</a> Firefox addon</li>
        <li>Go to <a href="https://youtube.com" target="_blank">youtube.com</a> and make sure you're <strong>logged in</strong></li>
        <li>Click the cookies.txt addon icon in toolbar</li>
        <li>Click <strong>"Current Site"</strong> to export only YouTube cookies</li>
        <li>Copy all the content and paste below</li>
      </ol>
    </div>

    <div id="status" class="status" style="display:none;"></div>

    <form id="cookieForm">
      <label for="secret">Admin Secret:</label>
      <input type="password" id="secret" name="secret" placeholder="Enter admin secret" required>
      
      <label for="cookies">Cookie Content:</label>
      <textarea id="cookies" name="cookies" placeholder="# Netscape HTTP Cookie File
# Paste your exported cookies here...
.youtube.com	TRUE	/	TRUE	1234567890	cookie_name	cookie_value" required></textarea>
      
      <button type="submit" id="submitBtn">🚀 Update Cookies</button>
    </form>
    
    <div id="result" class="result"></div>
  </div>

  <script>
    const form = document.getElementById('cookieForm');
    const result = document.getElementById('result');
    const submitBtn = document.getElementById('submitBtn');
    const statusDiv = document.getElementById('status');

    // Check current status on load
    async function checkStatus() {
      const secret = localStorage.getItem('adminSecret');
      if (!secret) return;
      
      try {
        const res = await fetch('/v1/youtube-cookies/status?secret=' + encodeURIComponent(secret));
        const data = await res.json();
        if (data.success && data.data) {
          const d = data.data;
          if (d.exists) {
            const modified = new Date(d.modifiedAt).toLocaleString();
            statusDiv.innerHTML = '📁 Current cookie file: ' + d.cookieCount + ' cookies, last updated: ' + modified;
            statusDiv.style.display = 'block';
          }
        }
      } catch (e) {}
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const secret = document.getElementById('secret').value;
      const cookies = document.getElementById('cookies').value;
      
      // Save secret for convenience
      localStorage.setItem('adminSecret', secret);
      
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Updating...';
      result.style.display = 'none';
      
      try {
        const response = await fetch('/v1/youtube-cookies/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'X-Admin-Secret': secret,
          },
          body: cookies,
        });
        
        const data = await response.json();
        
        result.style.display = 'block';
        if (data.success) {
          result.className = 'result success';
          result.innerHTML = '✅ ' + data.message + '<br>Lines: ' + (data.data?.linesCount || 'N/A');
          checkStatus();
        } else {
          result.className = 'result error';
          result.innerHTML = '❌ ' + data.message;
        }
      } catch (error) {
        result.style.display = 'block';
        result.className = 'result error';
        result.innerHTML = '❌ Error: ' + error.message;
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Update Cookies';
    });

    // Load saved secret
    const savedSecret = localStorage.getItem('adminSecret');
    if (savedSecret) {
      document.getElementById('secret').value = savedSecret;
      checkStatus();
    }
  </script>
</body>
</html>
`;
  
  res.type('html').send(html);
});

/**
 * POST /v1/youtube-cookies/notify-test
 * Test the notification system
 */
router.post('/notify-test', adminAuth, async (req, res) => {
  try {
    await cookieManager.sendCookieExpiryNotification('TEST: This is a test notification to verify the cookie expiry alert system is working.');
    res.json({
      success: true,
      message: 'Test notification sent',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
