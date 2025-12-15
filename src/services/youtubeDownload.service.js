const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { uploadToS3, deleteLocalFile } = require('./s3.service');
const { Content, YouTubeVideo } = require('../models');
const config = require('../config/config');
const cookieManager = require('./youtubeCookieManager.service');

const execPromise = promisify(exec);

// Ensure PATH includes yt-dlp and deno locations for Ubuntu
const HOME = os.homedir();
const EXTENDED_PATH = [
  `${HOME}/.local/bin`,
  `${HOME}/.deno/bin`,
  '/usr/local/bin',
  '/usr/bin',
  process.env.PATH
].join(':');

// Environment for child processes
const EXEC_ENV = {
  ...process.env,
  PATH: EXTENDED_PATH,
  DENO_INSTALL: `${HOME}/.deno`
};

// Temp downloads directory
const DOWNLOADS_DIR = path.resolve(process.cwd(), 'temp-youtube-downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

/**
 * Check if yt-dlp PO Token plugin is installed
 * This is the recommended way to handle YouTube authentication
 */
async function checkPOTokenPlugin() {
  try {
    const { stdout } = await execPromise('yt-dlp --list-plugins 2>/dev/null || echo "no-plugins"', { env: EXEC_ENV });
    const hasPOT = stdout.includes('pot') || stdout.includes('bgutil');
    if (hasPOT) {
      console.log('[YouTube Download] ✓ PO Token plugin detected');
    }
    return hasPOT;
  } catch {
    return false;
  }
}

/**
 * Install yt-dlp PO Token plugin if not present
 * Uses bgutil-ytdlp-pot-provider which is the recommended plugin
 */
async function ensurePOTokenPlugin() {
  try {
    const hasPlugin = await checkPOTokenPlugin();
    if (hasPlugin) return true;

    console.log('[YouTube Download] Installing PO Token plugin...');

    // Try pip install first (works on both Mac and Ubuntu)
    try {
      await execPromise('pip3 install bgutil-ytdlp-pot-provider --quiet --break-system-packages 2>/dev/null || pip3 install bgutil-ytdlp-pot-provider --quiet', { timeout: 60000, env: EXEC_ENV });
      console.log('[YouTube Download] ✓ PO Token plugin installed via pip');
      return true;
    } catch (pipError) {
      console.log('[YouTube Download] pip install failed, trying pipx...');
    }

    // Try pipx as fallback
    try {
      await execPromise('pipx inject yt-dlp bgutil-ytdlp-pot-provider', { timeout: 60000, env: EXEC_ENV });
      console.log('[YouTube Download] ✓ PO Token plugin installed via pipx');
      return true;
    } catch (pipxError) {
      console.log('[YouTube Download] pipx install failed');
    }

    console.log('[YouTube Download] ⚠ Could not install PO Token plugin - will use fallback methods');
    return false;
  } catch (error) {
    console.log('[YouTube Download] PO Token plugin check failed:', error.message);
    return false;
  }
}

/**
 * Test if POT provider is generating valid tokens
 * @returns {Promise<{available: boolean, working: boolean, error?: string}>}
 */
async function testPOTProvider() {
  const http = require('http');

  try {
    // First check if server is available
    const isAvailable = await new Promise((resolve) => {
      const req = http.get('http://127.0.0.1:4416/', { timeout: 3000 }, (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 404);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    });

    if (!isAvailable) {
      return { available: false, working: false, error: 'POT server not running on port 4416' };
    }

    // Try to get an actual POT token for a test video ID
    // Using the /generate endpoint which is used by newer versions
    const testResult = await new Promise((resolve) => {
      // Try the /get_pot endpoint first (used by bgutil plugin)  
      const postData = JSON.stringify({
        videoId: 'dQw4w9WgXcQ',
        context: 'gvs'  // gvs = Google Video Server
      });

      const options = {
        hostname: '127.0.0.1',
        port: 4416,
        path: '/get_pot',
        method: 'POST',
        timeout: 15000,  // Increased timeout for token generation
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            // Check for various token response formats
            if (json.po_token || json.poToken || json.token || json.pot) {
              const token = json.po_token || json.poToken || json.token || json.pot;
              console.log(`[YouTube Download] POT token received (length: ${token.length})`);
              resolve({ working: true, tokenLength: token.length });
            } else if (json.error) {
              resolve({ working: false, error: json.error });
            } else {
              // Some versions just return the token directly or have different structure
              if (typeof data === 'string' && data.length > 50) {
                resolve({ working: true, rawResponse: true });
              } else {
                resolve({ working: false, error: `Unexpected response: ${JSON.stringify(json).substring(0, 100)}` });
              }
            }
          } catch (e) {
            // If response is not JSON but we got a 200, consider it working
            if (res.statusCode === 200 || res.statusCode === 202) {
              resolve({ working: true, rawResponse: true });
            } else {
              resolve({ working: false, error: `Parse error: ${data.substring(0, 100)}` });
            }
          }
        });
      });

      req.on('error', (e) => resolve({ working: false, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ working: false, error: 'Request timeout - server may be overloaded' }); });

      req.write(postData);
      req.end();
    });

    return { available: true, ...testResult };
  } catch (error) {
    return { available: false, working: false, error: error.message };
  }
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '');
    }
    return parsed.searchParams.get('v');
  } catch (err) {
    return null;
  }
}

/**
 * Download YouTube video with yt-dlp - ROBUST PERMANENT SOLUTION
 * Uses PO Token plugin (recommended) with multiple client fallbacks
 * Downloads HIGHEST AVAILABLE quality, merges video+audio, outputs single MP4
 * Works on both Mac and Ubuntu without cookies
 * 
 * @param {string} youtubeUrl - YouTube URL
 * @param {string} contentId - Content document ID
 * @param {Object} options - Download options
 * @returns {Promise<string>} - Local file path
 */
async function downloadYouTubeVideo(youtubeUrl, contentId, options = {}) {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Update status to downloading
  await Content.findByIdAndUpdate(contentId, {
    youTubeDownloadStatus: 'downloading',
    youTubeDownloadProgress: 0,
  });

  // Sanitize URL
  const urlMatch = (youtubeUrl || '').match(/https?:\/\/[^\s]+/);
  const finalUrl = urlMatch ? urlMatch[0] : youtubeUrl;

  console.log('[YouTube Download] ═══════════════════════════════════════');
  console.log('[YouTube Download] Starting PERMANENT download solution');
  console.log('[YouTube Download] URL:', finalUrl);
  console.log('[YouTube Download] Video ID:', videoId);
  console.log('[YouTube Download] Platform:', process.platform);
  console.log('[YouTube Download] ═══════════════════════════════════════');

  const outputTemplate = path.join(DOWNLOADS_DIR, `${contentId}_${videoId}.mp4`);

  // Clean up any existing file
  if (fs.existsSync(outputTemplate)) {
    fs.unlinkSync(outputTemplate);
  }

  try {
    // Step 1: Verify yt-dlp is installed and get version
    console.log('[YouTube Download] Checking yt-dlp...');
    console.log('[YouTube Download] Using PATH:', EXTENDED_PATH.substring(0, 100) + '...');
    let ytDlpVersion = 'unknown';
    try {
      const { stdout } = await execPromise('yt-dlp --version', { env: EXEC_ENV });
      ytDlpVersion = stdout.trim();
      console.log('[YouTube Download] ✓ yt-dlp version:', ytDlpVersion);
    } catch (e) {
      throw new Error('yt-dlp is not installed. Install with: pip3 install -U yt-dlp');
    }

    // Check for deno (JS runtime)
    try {
      const { stdout: denoVersion } = await execPromise('deno --version', { env: EXEC_ENV });
      console.log('[YouTube Download] ✓ Deno available:', denoVersion.split('\n')[0]);
    } catch {
      console.log('[YouTube Download] ⚠ Deno not found - YouTube may require JS runtime');
    }

    // Step 2: Check/Install PO Token plugin (recommended for permanent solution)
    await ensurePOTokenPlugin();

    // Step 3: Check ffmpeg
    let ffmpegAvailable = false;
    try {
      await execPromise('ffmpeg -version', { env: EXEC_ENV });
      ffmpegAvailable = true;
      console.log('[YouTube Download] ✓ ffmpeg available');
    } catch {
      console.log('[YouTube Download] ⚠ ffmpeg not found - will use single stream');
    }

    // Step 4: Get video info first
    console.log('[YouTube Download] Fetching video info...');
    let videoTitle = 'Unknown';
    let availableFormats = [];
    try {
      const { stdout: infoJson } = await execPromise(
        `yt-dlp --dump-json --no-playlist "${finalUrl}"`,
        { timeout: 30000, maxBuffer: 1024 * 1024 * 10, env: EXEC_ENV }
      );
      const info = JSON.parse(infoJson);
      videoTitle = info.title || 'Unknown';
      availableFormats = info.formats || [];
      console.log('[YouTube Download] ✓ Title:', videoTitle);
      console.log('[YouTube Download] ✓ Duration:', info.duration, 'seconds');

      // Find best available quality
      const videoFormats = availableFormats.filter(f => f.vcodec !== 'none' && f.height);
      const maxHeight = Math.max(...videoFormats.map(f => f.height || 0));
      console.log('[YouTube Download] ✓ Max available quality:', maxHeight + 'p');
    } catch (e) {
      console.log('[YouTube Download] Could not fetch info (will try download anyway):', e.message);
    }

    // Step 5: Build time section argument if needed
    const sectionArg = options.startTime
      ? `--download-sections "*${options.startTime}-${options.endTime || 'inf'}"`
      : '';

    // Step 6: Define download strategies (ordered by quality preference)
    // Using flexible format selection that falls back gracefully
    const downloadStrategies = [
      {
        name: 'Best Quality (Auto)',
        format: 'bv*+ba/b',  // Best video + best audio, or best combined
        args: '--merge-output-format mp4',
        description: 'Automatic best quality selection'
      },
      {
        name: 'Best Video+Audio',
        format: 'bestvideo+bestaudio/best',
        args: '--merge-output-format mp4',
        description: 'Best separate streams merged'
      },
      {
        name: 'Best MP4',
        format: 'best[ext=mp4]/best',
        args: '',
        description: 'Best MP4 format available'
      },
      {
        name: 'Any Format',
        format: 'best',
        args: '',
        description: 'Any available format'
      },
      {
        name: 'Worst Quality (Fallback)',
        format: 'worst',
        args: '',
        description: 'Lowest quality as last resort'
      }
    ];

    // Check for proxy configuration
    const proxyArg = config.youtube?.proxy ? `--proxy "${config.youtube.proxy}"` : '';
    if (proxyArg) {
      console.log('[YouTube Download] ✓ Using proxy:', config.youtube.proxy.replace(/:[^:@]+@/, ':***@'));
    }

    // Check if BgUtils POT Provider is running and working
    const potStatus = await testPOTProvider();
    const potProviderAvailable = potStatus.available && potStatus.working !== false;

    if (potStatus.available) {
      if (potStatus.working) {
        console.log('[YouTube Download] ✓ BgUtils POT Provider running on port 4416');
        console.log('[YouTube Download] ✓ POT token generation test: PASSED');
      } else {
        console.log('[YouTube Download] ⚠ BgUtils POT Provider running but may have issues');
        console.log(`[YouTube Download]   Issue: ${potStatus.error || 'Unknown'}`);
        console.log('[YouTube Download]   Try restarting: docker restart bgutil-provider');
      }
    } else {
      console.log('[YouTube Download] ⚠ BgUtils POT Provider not running');
      console.log('[YouTube Download]   Start it with: docker run --name bgutil-provider -d -p 4416:4416 brainicism/bgutil-ytdlp-pot-provider');
    }

    // Check if OAuth2 plugin is installed (another reliable method)
    let oauth2Available = false;
    try {
      const { stdout: plugins } = await execPromise('yt-dlp --list-extractors 2>/dev/null | grep -i oauth || echo ""', { env: EXEC_ENV, timeout: 5000 });
      oauth2Available = plugins.toLowerCase().includes('oauth');
      if (oauth2Available) {
        console.log('[YouTube Download] ✓ OAuth2 plugin detected');
      }
    } catch (e) {
      // OAuth2 plugin check failed
    }

    // Check for cookie file
    const cookieFile = config.youtube?.cookieFile || path.join(process.cwd(), 'youtube-cookies.txt');
    const cookieFileExists = fs.existsSync(cookieFile);
    if (cookieFileExists) {
      // Validate cookie file has content
      const cookieStats = fs.statSync(cookieFile);
      if (cookieStats.size > 100) {
        console.log('[YouTube Download] ✓ Cookie file available:', cookieFile, `(${Math.round(cookieStats.size / 1024)}KB)`);
      } else {
        console.log('[YouTube Download] ⚠ Cookie file exists but appears empty or too small');
      }
    }

    // Build authentication strategies (ordered by preference)
    // Strategy 1: POT provider FIRST (most reliable for bypassing bot detection)
    // Strategy 2: POT + Cookies combined (for restricted videos)
    // Strategy 3: Use cookies file alone if available
    // Strategy 4: OAuth2 if configured  
    // Strategy 5: No auth (may fail for restricted content)
    const authStrategies = [];

    // POT token provider - PRIORITY 1 for bot detection bypass
    // The plugin auto-detects the server at http://127.0.0.1:4416
    // Adding explicit extractor-args ensures it's used properly
    if (potProviderAvailable) {
      // Try POT with web client first (most compatible)
      authStrategies.push({
        name: 'POT Token Provider (Web)',
        args: '--extractor-args "youtube:player-client=web"',
        description: 'Using BgUtils POT Provider with web client'
      });

      // Try POT with mweb client (mobile web - often bypasses restrictions)
      authStrategies.push({
        name: 'POT Token Provider (mWeb)',
        args: '--extractor-args "youtube:player-client=mweb"',
        description: 'Using BgUtils POT Provider with mobile web client'
      });

      // Try POT with TV client (another fallback)
      authStrategies.push({
        name: 'POT Token Provider (TV)',
        args: '--extractor-args "youtube:player-client=tv"',
        description: 'Using BgUtils POT Provider with TV client'
      });
    }

    // POT + Cookies combined (for age-restricted or login-required videos)
    if (potProviderAvailable && cookieFileExists) {
      authStrategies.push({
        name: 'POT + Cookies Combined',
        args: `--cookies "${cookieFile}" --extractor-args "youtube:player-client=web"`,
        description: 'Using POT Provider with cookies for restricted content'
      });
    }

    // Cookies alone (may still trigger bot detection on some IPs)
    if (cookieFileExists) {
      authStrategies.push({
        name: 'Cookie Authentication',
        args: `--cookies "${cookieFile}"`,
        description: 'Using exported browser cookies only'
      });
    }

    if (oauth2Available) {
      authStrategies.push({
        name: 'OAuth2',
        args: '--username oauth2 --password ""',
        description: 'Using OAuth2 plugin authentication'
      });
    }

    // iOS client - often bypasses bot detection on datacenter IPs
    authStrategies.push({
      name: 'iOS Client',
      args: '--extractor-args "youtube:player-client=ios"',
      description: 'Using iOS client (no POT needed, often works on datacenter IPs)'
    });

    // Android client - another option that may bypass bot detection
    authStrategies.push({
      name: 'Android Client',
      args: '--extractor-args "youtube:player-client=android"',
      description: 'Using Android client (no POT needed)'
    });

    // Media Connect client - newer option
    authStrategies.push({
      name: 'Media Connect Client',
      args: '--extractor-args "youtube:player-client=mediaconnect"',
      description: 'Using Media Connect client'
    });

    // Fallback: POT with explicit base URL (legacy behavior)
    if (potProviderAvailable) {
      authStrategies.push({
        name: 'POT with Legacy Mode',
        args: '--extractor-args "youtube:player-client=web;getpot_bgutil_baseurl=http://127.0.0.1:4416"',
        description: 'Using POT Provider with explicit base URL'
      });
    }

    // Always add no-auth as last fallback
    authStrategies.push({
      name: 'No Authentication',
      args: '',
      description: 'Attempting without authentication'
    });

    console.log(`[YouTube Download] Authentication strategies available: ${authStrategies.map(s => s.name).join(', ')}`);

    // Base common arguments (without auth)
    const baseCommonArgs = [
      '--no-playlist',
      '--progress',
      '--newline',
      '--retries 10',
      '--fragment-retries 10',
      '--socket-timeout 30',
      '--force-ipv4',
      '--geo-bypass',
      '--no-check-certificates',
      // Updated Chrome user agent - December 2024
      `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"`,
      proxyArg,
    ].filter(Boolean);

    let downloadSuccess = false;
    let lastError = null;

    // Try each auth strategy with each download format strategy
    // This gives maximum flexibility for different video types and server configurations
    authLoop: for (const authStrategy of authStrategies) {
      if (downloadSuccess) break;

      console.log(`\n[YouTube Download] ════════ AUTH: ${authStrategy.name} ════════`);
      console.log(`[YouTube Download] ${authStrategy.description}`);

      for (const formatStrategy of downloadStrategies) {
        if (downloadSuccess) break authLoop;

        console.log(`\n[YouTube Download] ▶ Trying: ${formatStrategy.name}`);
        console.log(`[YouTube Download]   ${formatStrategy.description}`);

        // Build complete args with auth strategy
        const commonArgs = [...baseCommonArgs, authStrategy.args].filter(Boolean).join(' ');

        const cmd = [
          'yt-dlp',
          `-f "${formatStrategy.format}"`,
          formatStrategy.args,
          commonArgs,
          sectionArg,
          `-o "${outputTemplate}"`,
          `"${finalUrl}"`
        ].filter(Boolean).join(' ');

        console.log('[YouTube Download] Command:', cmd.substring(0, 250) + '...');

        try {
          await new Promise((resolve, reject) => {
            const child = exec(cmd, {
              maxBuffer: 1024 * 1024 * 100,
              timeout: 600000, // 10 minute timeout
              env: EXEC_ENV
            });

            let lastProgress = '';
            let stderrOutput = '';

            child.stdout.on('data', (data) => {
              const output = String(data);
              // Show progress updates
              if (output.includes('%')) {
                const match = output.match(/(\d+\.?\d*)%/);
                if (match && match[1] !== lastProgress) {
                  lastProgress = match[1];
                  process.stdout.write(`\r[YouTube Download] Progress: ${lastProgress}%`);
                }
              }
            });

            child.stderr.on('data', (data) => {
              const output = String(data);
              stderrOutput += output;
              if (output.includes('ERROR')) {
                console.log('\n[YouTube Download] Error:', output.trim());
              }
            });

            child.on('close', (code) => {
              console.log(''); // New line after progress
              if (code === 0) {
                resolve();
              } else {
                // Check if it's a bot detection error specifically
                if (stderrOutput.includes('Sign in to confirm') || stderrOutput.includes('bot')) {
                  reject(new Error(`Bot detection: Exit code ${code}`));
                } else {
                  reject(new Error(`Exit code ${code}`));
                }
              }
            });

            child.on('error', reject);
          });

          // Verify file exists and has content
          if (fs.existsSync(outputTemplate)) {
            const stats = fs.statSync(outputTemplate);
            if (stats.size > 1000) { // At least 1KB
              downloadSuccess = true;
              console.log(`[YouTube Download] ✓ SUCCESS with ${authStrategy.name} + ${formatStrategy.name}`);
              console.log(`[YouTube Download] ✓ File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
              break authLoop;
            } else {
              console.log(`[YouTube Download] ✗ File too small, trying next method`);
              fs.unlinkSync(outputTemplate);
            }
          }
        } catch (error) {
          console.log(`[YouTube Download] ✗ ${formatStrategy.name} failed:`, error.message);
          lastError = error;

          // Clean up partial file
          if (fs.existsSync(outputTemplate)) {
            try { fs.unlinkSync(outputTemplate); } catch { }
          }

          // If it's a bot detection error, try next auth strategy (not format strategy)
          if (error.message.includes('Bot detection')) {
            console.log('[YouTube Download] Bot detection error - trying next auth strategy...');
            break; // Break inner loop, continue with next auth strategy
          }
        }
      }
    }

    if (!downloadSuccess || !fs.existsSync(outputTemplate)) {
      throw new Error(`All download methods failed. Last error: ${lastError?.message || 'Unknown'}`);
    }

    // Step 7: Verify downloaded video quality
    const stats = fs.statSync(outputTemplate);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('[YouTube Download] ═══════════════════════════════════════');
    console.log('[YouTube Download] ✓ DOWNLOAD COMPLETE!');
    console.log('[YouTube Download] ✓ File:', outputTemplate);
    console.log('[YouTube Download] ✓ Size:', fileSizeMB, 'MB');

    // Get actual resolution
    try {
      const { stdout: metadataJson } = await execPromise(
        `ffprobe -v quiet -print_format json -show_streams "${outputTemplate}"`,
        { env: EXEC_ENV }
      );
      const metadata = JSON.parse(metadataJson);
      const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
      if (videoStream) {
        console.log(`[YouTube Download] ✓ Resolution: ${videoStream.width}x${videoStream.height}`);
        console.log(`[YouTube Download] ✓ Codec: ${videoStream.codec_name}`);
        console.log(`[YouTube Download] ✓ Bitrate: ${Math.round((videoStream.bit_rate || 0) / 1000)} kbps`);
      }
    } catch (e) {
      console.log('[YouTube Download] Could not read metadata');
    }
    console.log('[YouTube Download] ═══════════════════════════════════════');

    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'downloaded',
      youTubeDownloadProgress: 100,
    });

    return outputTemplate;
  } catch (error) {
    console.error('[YouTube Download] ═══════════════════════════════════════');
    console.error('[YouTube Download] ✗ DOWNLOAD FAILED:', error.message);
    console.error('[YouTube Download] ═══════════════════════════════════════');

    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'failed',
      youTubeDownloadError: error.message,
    });
    throw error;
  }
}

/**
 * Get video metadata using yt-dlp (no cookies needed)
 */
async function getVideoMetadata(youtubeUrl) {
  try {
    const cmd = `yt-dlp --dump-json --no-playlist --no-warnings "${youtubeUrl}"`;
    const { stdout } = await execPromise(cmd, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 30000,
      env: EXEC_ENV
    });

    const metadata = JSON.parse(stdout);
    return metadata;
  } catch (error) {
    console.error('[YouTube Metadata] Error:', error.message);
    return null;
  }
}

/**
 * Complete YouTube video processing workflow
 * Downloads video, uploads to S3, updates YouTubeVideo model and Content
 * @param {string} contentId - Content document ID
 */
async function processYouTubeVideo(contentId) {
  let localFilePath = null;
  let youtubeVideo = null;

  try {
    console.log('[YouTube Processor] Starting processing for content:', contentId);

    // Get content document
    const content = await Content.findById(contentId);
    if (!content || !content.youTubeUrl) {
      throw new Error('Content not found or no YouTube URL');
    }

    const youtubeUrl = content.youTubeUrl;
    const videoId = extractVideoId(youtubeUrl);

    // Step 1: Check if video already exists in YouTubeVideo collection
    youtubeVideo = await YouTubeVideo.findOne({ videoId });

    if (youtubeVideo && youtubeVideo.downloadStatus === 'completed' && youtubeVideo.s3Url) {
      console.log('[YouTube Processor] ✓ Video already downloaded! Using existing:', youtubeVideo.s3Url);

      // Increment usage count
      await youtubeVideo.incrementUsage();

      // Update Content with existing S3 URL
      await Content.findByIdAndUpdate(contentId, {
        youTubeDownloadStatus: 'completed',
        youTubeDownloadedUrl: youtubeVideo.s3Url,
        youTubeDownloadProgress: 100,
        youTubeDownloadError: null,
        youtubeVideoRef: youtubeVideo._id,
      });

      return youtubeVideo.s3Url;
    }

    // Step 2: Create or get YouTubeVideo entry
    if (!youtubeVideo) {
      youtubeVideo = await YouTubeVideo.findOrCreateByUrl(youtubeUrl);
    }

    youtubeVideo.downloadStatus = 'downloading';
    youtubeVideo.downloadStartedAt = new Date();
    await youtubeVideo.save();

    // Step 3: Get metadata
    console.log('[YouTube Processor] Fetching metadata...');
    const metadata = await getVideoMetadata(youtubeUrl);
    if (metadata) {
      await youtubeVideo.updateMetadata({
        title: metadata.title,
        description: metadata.description,
        duration: metadata.duration,
        uploadDate: metadata.upload_date,
        uploader: metadata.uploader,
        channelId: metadata.channel_id,
        channelUrl: metadata.channel_url,
        viewCount: metadata.view_count,
        likeCount: metadata.like_count,
        thumbnail: metadata.thumbnail,
        categories: metadata.categories,
        tags: metadata.tags,
      });
      console.log('[YouTube Processor] ✓ Metadata saved');
    }

    // Parse start/end times if provided
    const options = {};
    if (content.youTubeStartTimer) {
      options.startTime = content.youTubeStartTimer;
      options.endTime = content.youTubeEndTimer;
    }

    // Step 4: Download video (highest quality available)
    localFilePath = await downloadYouTubeVideo(youtubeUrl, contentId, options);

    // Step 5: Extract actual format details from downloaded file
    const stats = fs.statSync(localFilePath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    // Get actual resolution from video file
    let downloadedFormat = {
      resolution: '1920x1080',
      height: 1080,
      width: 1920,
      filesize: stats.size,
      filesizeMB: parseFloat(fileSizeMB),
      ext: 'mp4',
    };

    try {
      const { stdout: metadataJson } = await execPromise(`ffprobe -v quiet -print_format json -show_streams "${localFilePath}"`, { env: EXEC_ENV });
      const metadata = JSON.parse(metadataJson);
      const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
      if (videoStream && videoStream.width && videoStream.height) {
        downloadedFormat = {
          resolution: `${videoStream.width}x${videoStream.height}`,
          height: videoStream.height,
          width: videoStream.width,
          filesize: stats.size,
          filesizeMB: parseFloat(fileSizeMB),
          ext: 'mp4',
        };
        console.log(`[YouTube Processor] ✓ Detected resolution: ${downloadedFormat.resolution}`);
      }
    } catch (error) {
      console.log('[YouTube Processor] Could not detect resolution, using default');
    }

    // Step 6: Upload to S3
    youtubeVideo.downloadStatus = 'uploading';
    await youtubeVideo.save();

    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'uploading',
    });

    const s3Key = `youtube-videos/${videoId}/${videoId}.mp4`;
    const s3Url = await uploadToS3(localFilePath, s3Key, 'video/mp4');

    // Step 7: Update YouTubeVideo with completion details
    await youtubeVideo.markCompleted(s3Url, s3Key, downloadedFormat);
    await youtubeVideo.incrementUsage();

    console.log('[YouTube Processor] ✓ YouTubeVideo updated with S3 URL');

    // Step 8: Update Content with S3 URL and reference
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'completed',
      youTubeDownloadedUrl: s3Url,
      youTubeDownloadProgress: 100,
      youTubeDownloadError: null,
      youtubeVideoRef: youtubeVideo._id,
    });

    console.log('[YouTube Processor] ✓ Processing complete! S3 URL:', s3Url);
    console.log('[YouTube Processor] ✓ YouTubeVideo ID:', youtubeVideo._id, '| Number:', youtubeVideo.videoNumber);

    // Step 9: Clean up local file
    await deleteLocalFile(localFilePath);

    return s3Url;
  } catch (error) {
    console.error('[YouTube Processor] Fatal error:', error.message);

    // Check if this is a cookie expiry error and send notification
    await cookieManager.handleYouTubeError(error.message);

    // Update YouTubeVideo status to failed
    if (youtubeVideo) {
      await youtubeVideo.markFailed(error.message);
    }

    // Update Content status to failed
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'failed',
      youTubeDownloadError: error.message,
    });

    // Clean up local file if exists
    if (localFilePath) {
      await deleteLocalFile(localFilePath);
    }

    throw error;
  }
}

module.exports = {
  downloadYouTubeVideo,
  processYouTubeVideo,
  extractVideoId,
  testPOTProvider,
};
