const { execFile, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { uploadToS3, deleteLocalFile } = require('./s3.service');
const { Content, YouTubeVideo } = require('../models');
const config = require('../config/config');
const googleOAuth = require('./googleOAuth.service');

const execFilePromise = promisify(execFile);
const execPromise = promisify(exec);

// Temp downloads directory
const DOWNLOADS_DIR = path.resolve(process.cwd(), 'temp-youtube-downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

const youtubeCookieService = require('./youtube.cookie.service');

/**
 * Get cookies for yt-dlp - try automated service first, then browser, then file
 */
async function getYtdlpCookies() {
  try {
    // Method 1: Try automated cookie service (User's preferred method)
    try {
      console.log('[YouTube Download] Checking/Refreshing cookies via automation...');
      // Only refresh if needed (checks expiry and validity)
      const isFresh = await youtubeCookieService.ensureFreshCookies();
      if (isFresh) {
        const cookiePath = youtubeCookieService.getCookiePath();
        if (fs.existsSync(cookiePath)) {
          console.log('[YouTube Download] ✓ Using automated cookies:', cookiePath);
          return cookiePath;
        }
      }
    } catch (error) {
      console.log('[YouTube Download] Automated cookie refresh failed:', error.message);
      // Fallthrough to other methods
    }

    // Method 2: Try browser cookies (Local dev fallback)
    const browserCookies = ['chrome', 'firefox', 'edge', 'safari'];
    for (const browser of browserCookies) {
      try {
        await execPromise(`yt-dlp --cookies-from-browser ${browser} --dump-json --no-playlist https://www.youtube.com/watch?v=dQw4w9WgXcQ`, { timeout: 15000 });
        console.log(`[YouTube Download] ✓ Using ${browser} cookies`);
        return browser;
      } catch (error) {
        // Silent fail for browsers
      }
    }

    // Method 3: Try static file (Legacy fallback)
    const cookieSource = config.youtube?.cookieFile || config.youtube?.cookie;
    if (cookieSource && fs.existsSync(cookieSource)) {
      console.log('[YouTube Download] Using static file cookies:', cookieSource);
      return cookieSource;
    }

    console.log('[YouTube Download] ⚠ No cookies available - will try without authentication');
    return null;
  } catch (error) {
    console.error('[YouTube Download] Error getting cookies:', error.message);
    return null;
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
 * Download YouTube video with yt-dlp and merge with ffmpeg
 * Downloads highest quality, merges video+audio, outputs single MP4
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

  // Sanitize URL in case of accidental duplication or extraneous text
  const urlMatch = (youtubeUrl || '').match(/https?:\/\/[^\s]+/);
  const finalUrl = urlMatch ? urlMatch[0] : youtubeUrl;

  console.log('[YouTube Download] Starting download for:', finalUrl);
  console.log('[YouTube Download] Video ID:', videoId);

  const outputTemplate = path.join(DOWNLOADS_DIR, `${contentId}_${videoId}.mp4`);
  try {
    // Diagnostic check
    try {
      console.log('[YouTube Download] Diagnostic Check:');
      const { stdout: nodePath } = await execPromise('which node || echo "node not found"');
      const { stdout: nodeVer } = await execPromise('node -v || echo "unknown"');
      console.log(`[YouTube Download] Node.js: ${nodePath.trim()} (${nodeVer.trim()})`);

      const { stdout: ffmpegPath } = await execPromise('which ffmpeg || echo "ffmpeg not found"');
      console.log(`[YouTube Download] ffmpeg: ${ffmpegPath.trim()}`);
    } catch (e) {
      console.log('[YouTube Download] Diagnostic check failed:', e.message);
    }

    console.log('[YouTube Download] Checking yt-dlp installation...');
    try {
      await execPromise('yt-dlp --version');
    } catch (e) {
      throw new Error('yt-dlp is not installed');
    }
    let ytDlpBin = 'yt-dlp';
    try {
      const { stdout: ytPathStdout } = await execPromise('command -v yt-dlp || which yt-dlp');
      if (ytPathStdout && ytPathStdout.trim()) {
        ytDlpBin = ytPathStdout.trim();
        console.log(`[YouTube Download] yt-dlp binary: ${ytDlpBin}`);
      }
    } catch (_) { }

    // Cookie support - prefer OAuth tokens
    let cookieArg = '';
    const cookieSource = await getYtdlpCookies();
    if (cookieSource) {
      if (cookieSource === 'chrome' || cookieSource === 'firefox' || cookieSource === 'edge' || cookieSource === 'safari') {
        cookieArg = ` --cookies-from-browser ${cookieSource}`;
        console.log('[YouTube Download] Using cookies from browser:', cookieSource);
      } else if (fs.existsSync(cookieSource)) {
        cookieArg = ` --cookies "${cookieSource}"`;
        console.log('[YouTube Download] Using cookie file:', cookieSource);
      } else {
        console.log('[YouTube Download] Cookie path not found:', cookieSource);
      }
    }

    // Common args to improve headless-server reliability
    const uaArg = ' --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"';
    const retryArgs = ' --retries 10 --fragment-retries 10 --socket-timeout 30 --geo-bypass';
    const ipArg = ' --force-ipv4';

    // Always use web client for best quality
    const extractorArg = ' --extractor-args "youtube:player_client=web"';

    let ffmpegArg = '';
    try {
      await execPromise('ffmpeg -version');
    } catch (_) {
      const configuredFfmpeg = config.youtube?.ffmpegPath;
      if (configuredFfmpeg && fs.existsSync(configuredFfmpeg)) {
        ffmpegArg = ` --ffmpeg-location "${configuredFfmpeg}"`;
      }
    }

    console.log('[YouTube Download] Fetching video info...');
    try {
      const { stdout: infoJson } = await execPromise(`${ytDlpBin}${cookieArg}${uaArg}${retryArgs}${ipArg}${extractorArg}${ffmpegArg} --dump-json "${finalUrl}"`);
      const info = JSON.parse(infoJson);
      if (info && info.title) {
        console.log('[YouTube Download] Title:', info.title);
      }
    } catch (_) { }

    try {
      const { stdout: formats } = await execPromise(`${ytDlpBin}${cookieArg}${uaArg}${retryArgs}${ipArg}${extractorArg}${ffmpegArg} -F "${finalUrl}"`);
      if (formats) {
        console.log(formats);
      }
    } catch (_) { }

    const sectionArg = options.startTime ? ` --download-sections "*${options.startTime}-${options.endTime || 'inf'}"` : '';

    // Robust multi-method approach - prioritize quality with proper client selection
    const downloadMethods = [
      {
        name: 'Best Quality (TV Client)',
        format: 'bv*[height<=2160]+ba/b',
        client: 'youtube:player_client=tv_embedded',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        useCookies: true
      },
      {
        name: 'Mixed Quality (Web Client)',
        format: 'bv*[height<=2160]+ba/b',
        client: 'youtube:player_client=web',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        useCookies: true
      },
      {
        name: 'iOS Client (High Quality)',
        format: 'bv*[height<=1080]+ba/b',
        client: 'youtube:player_client=ios',
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        useCookies: true
      },
      {
        name: 'High Quality (Android SDK-less)',
        format: 'bv*[height<=1080]+ba/b',
        client: 'youtube:player_client=android,youtube:player_skip=configs',
        ua: 'com.google.android.youtube/19.45.38 (Linux; U; Android 13) gzip',
        useCookies: false
      },
      {
        name: 'Android Embedded',
        format: 'bv*+ba/b',
        client: 'youtube:player_client=android_embedded',
        ua: 'com.google.android.youtube/19.45.38 (Linux; U; Android 13) gzip',
        useCookies: false
      },
      {
        name: 'Best Available (Fallback)',
        format: 'b',
        client: 'youtube:player_client=android,youtube:player_skip=webpage,configs',
        ua: 'com.google.android.youtube/19.45.38 (Linux; U; Android 13) gzip',
        useCookies: false
      }
    ];

    let lastError = null;
    let stderrBuf = '';

    for (const method of downloadMethods) {
      try {
        console.log(`[YouTube Download] Trying method: ${method.name}`);

        const methodCookieArg = method.useCookies && cookieSource ?
          (cookieSource.includes('chrome') || cookieSource.includes('firefox') || cookieSource.includes('edge') || cookieSource.includes('safari') ?
            ` --cookies-from-browser ${cookieSource}` : ` --cookies "${cookieSource}"`) : '';

        const methodCmd = [
          ytDlpBin,
          `-f "${method.format}"`,
          '--merge-output-format mp4',
          `--output "${outputTemplate}"`,
          '--no-playlist',
          '--progress',
          '--newline',
          '--remote-components ejs:github', // Enable remote components for challenge solving
          sectionArg,
          methodCookieArg,
          ` --user-agent "${method.ua}"`,
          retryArgs,
          ipArg,
          ` --extractor-args "${method.client}"`,
          ffmpegArg,
          `"${finalUrl}"`
        ].join(' ');

        console.log(`[YouTube Download] Running ${method.name} command:`, methodCmd);

        stderrBuf = ''; // Reset for each method
        await new Promise((resolve, reject) => {
          const child = exec(methodCmd, { maxBuffer: 1024 * 1024 * 100 });
          child.stdout.on('data', (data) => process.stdout.write(data));
          child.stderr.on('data', (data) => {
            const output = String(data);
            process.stderr.write(output);
            if (output.includes('ERROR') || output.includes('WARNING')) {
              stderrBuf += output;
            }
          });
          child.on('close', (code) => {
            if (code === 0) return resolve();
            reject(new Error(`${method.name} exited with code ${code}`));
          });
          child.on('error', reject);
        });

        console.log(`[YouTube Download] ✓ ${method.name} succeeded!`);
        break; // Success! Exit the loop

      } catch (error) {
        console.log(`[YouTube Download] ✗ ${method.name} failed:`, error.message);
        lastError = error;
        continue; // Try next method
      }
    }

    if (!fs.existsSync(outputTemplate)) {
      throw new Error('Downloaded file not found');
    }

    const stats = fs.statSync(outputTemplate);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log('[YouTube Download] ✓ Download complete! File size:', fileSizeMB, 'MB');

    // Get video metadata to verify quality
    try {
      const { stdout: metadataJson } = await execPromise(`ffprobe -v quiet -print_format json -show_streams "${outputTemplate}"`);
      const metadata = JSON.parse(metadataJson);
      const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
      if (videoStream) {
        console.log(`[YouTube Download] ✓ Video resolution: ${videoStream.width}x${videoStream.height}`);
        console.log(`[YouTube Download] ✓ Video codec: ${videoStream.codec_name}`);
      }
    } catch (error) {
      console.log('[YouTube Download] Could not read video metadata:', error.message);
    }

    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'downloaded',
      youTubeDownloadProgress: 100,
    });

    // Clean up temporary OAuth cookie file if it exists
    const tempCookieFile = path.join(DOWNLOADS_DIR, 'oauth-cookies.txt');
    if (fs.existsSync(tempCookieFile)) {
      try {
        fs.unlinkSync(tempCookieFile);
        console.log('[YouTube Download] ✓ Cleaned up temporary OAuth cookie file');
      } catch (error) {
        console.error('[YouTube Download] Error cleaning up OAuth cookie file:', error.message);
      }
    }

    return outputTemplate;
  } catch (error) {
    console.error('[YouTube Download] Error:', error.message);
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'failed',
      youTubeDownloadError: error.message,
    });
    throw error;
  }
}

/**
 * Get video metadata using yt-dlp
 */
async function getVideoMetadata(youtubeUrl) {
  try {
    const args = ['--dump-json', '--no-playlist', youtubeUrl];

    // Use OAuth cookies or traditional cookies
    const cookieSource = await getYtdlpCookies();
    if (cookieSource) {
      if (cookieSource === 'chrome' || cookieSource === 'firefox' || cookieSource === 'edge' || cookieSource === 'safari') {
        args.push('--cookies-from-browser', cookieSource);
      } else if (fs.existsSync(cookieSource)) {
        args.push('--cookies', cookieSource);
      }
    }

    const { stdout } = await execFilePromise('yt-dlp', args, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
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
      const { stdout: metadataJson } = await execPromise(`ffprobe -v quiet -print_format json -show_streams "${localFilePath}"`);
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
};
