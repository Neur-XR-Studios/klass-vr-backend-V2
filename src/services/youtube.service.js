const youtubedl = require('youtube-dl-exec');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

// In-memory cache for resolved YouTube URLs (TTL: 5 hours to be safe)
const urlCache = new Map();
const CACHE_TTL = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

/**
 * Generate proxied URL to avoid 403 errors
 * WARNING: Only use for testing/fallback. Not suitable for production with 30+ devices.
 */
function generateProxiedUrl(directUrl) {
  const baseUrl = config.env === 'development'
    ? 'https://api.klassdraw.com'
    : `http://localhost:${config.port}`;
  return `${baseUrl}/v1/youtube-proxy/stream?url=${encodeURIComponent(directUrl)}`;
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of urlCache.entries()) {
    if (now > value.expiresAt) {
      urlCache.delete(key);
      console.log('[YouTube Resolver] Removed expired cache for:', key);
    }
  }
}

// Run cache cleanup every 30 minutes
setInterval(cleanExpiredCache, 30 * 60 * 1000);

/**
 * Normalize YouTube URL (remove tracking params)
 */
function normalizeYouTubeUrl(url) {
  try {
    const parsed = new URL(url);

    // Convert youtu.be to youtube.com/watch
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '');
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // For regular youtube.com URLs, just extract the video ID
    const videoId = parsed.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    return url;
  } catch (err) {
    return url;
  }
}

/**
 * Resolve a YouTube URL to a directly playable URL at the highest available quality.
 * Uses yt-dlp (via youtube-dl-exec) which is more reliable than ytdl-core.
 * 
 * @param {string} url - YouTube URL
 * @returns {Promise<Object|null>} Resolved video info with playable URLs
 */
async function resolveYouTubePlayable(url) {
  try {
    // Clean expired cache periodically
    if (Math.random() < 0.1) cleanExpiredCache();

    // Normalize and check cache
    const cacheKey = normalizeYouTubeUrl(url);
    const cached = urlCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log('[YouTube Resolver] Returning cached result for:', cacheKey);
      return cached.data;
    }

    console.log('[YouTube Resolver] Attempting to resolve:', url);

    // Use yt-dlp to get video info
    const options = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      format: 'bestvideo+bestaudio/best',
      // User agent
      userAgent: config.youtube?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    // Add cookies - REQUIRED to bypass YouTube bot detection
    if (config.youtube?.cookie) {
      const cookiePath = path.isAbsolute(config.youtube.cookie)
        ? config.youtube.cookie
        : path.resolve(process.cwd(), config.youtube.cookie);
      try {
        if (fs.existsSync(cookiePath)) {
          options.cookies = cookiePath; // absolute path to Netscape cookie file
        } else {
          console.warn('[YouTube Resolver] Cookie file not found at:', cookiePath);
        }
      } catch (e) {
        console.warn('[YouTube Resolver] Unable to access cookie file:', cookiePath, e.message);
      }
    } else if (config.youtube?.cookieFile) {
      const cookiePath = path.isAbsolute(config.youtube.cookieFile)
        ? config.youtube.cookieFile
        : path.resolve(process.cwd(), config.youtube.cookieFile);
      try {
        if (fs.existsSync(cookiePath)) {
          options.cookies = cookiePath;
        } else {
          console.warn('[YouTube Resolver] Cookie file (cookieFile) not found at:', cookiePath);
        }
      } catch (e) {
        console.warn('[YouTube Resolver] Unable to access cookie file (cookieFile):', cookiePath, e.message);
      }
    } else if (config.youtube?.cookiesFromBrowser) {
      options.cookiesFromBrowser = config.youtube.cookiesFromBrowser;
    } else {
      console.warn('[YouTube Resolver] No cookies configured! YouTube may block requests.');
      console.warn('[YouTube Resolver] Please set config.youtube.cookie to a Netscape cookie file path (e.g. ./youtube-cookies.txt)');
    }

    const info = await youtubedl(cacheKey, options);

    console.log('[YouTube Resolver] Video resolved:', info.title);
    console.log('[YouTube Resolver] Available formats:', info.formats?.length || 0);

    if (!info.formats || info.formats.length === 0) {
      console.warn('[YouTube Resolver] No formats available');
      return null;
    }

    // Separate formats by type
    const formats = info.formats;
    const muxed = formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url);
    const videoOnly = formats.filter(f => f.vcodec !== 'none' && f.acodec === 'none' && f.url);
    const audioOnly = formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none' && f.url);

    console.log('[YouTube Resolver] Format breakdown - Muxed:', muxed.length, 'Video-only:', videoOnly.length, 'Audio-only:', audioOnly.length);

    // Sort by quality (height first, then bitrate)
    const sortByQuality = (a, b) => {
      const heightA = a.height || 0;
      const heightB = b.height || 0;
      if (heightB !== heightA) return heightB - heightA;

      // Prefer mp4 container
      const scoreA = (a.ext === 'mp4' || a.video_ext === 'mp4') ? 1 : 0;
      const scoreB = (b.ext === 'mp4' || b.video_ext === 'mp4') ? 1 : 0;
      if (scoreB !== scoreA) return scoreB - scoreA;

      // Then by bitrate
      const bitrateA = a.tbr || a.vbr || 0;
      const bitrateB = b.tbr || b.vbr || 0;
      return bitrateB - bitrateA;
    };

    // Get best formats
    const bestMuxed = muxed.length > 0 ? muxed.sort(sortByQuality)[0] : null;
    const bestVideoOnly = videoOnly.length > 0 ? videoOnly.sort(sortByQuality)[0] : null;
    const bestAudioOnly = audioOnly.length > 0
      ? audioOnly.sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0]
      : null;

    // Prefer highest quality (usually video-only formats have better quality)
    const muxedHeight = bestMuxed?.height || 0;
    const videoOnlyHeight = bestVideoOnly?.height || 0;

    const chosenVideo = videoOnlyHeight >= muxedHeight ? bestVideoOnly : bestMuxed;

    if (!chosenVideo) {
      console.warn('[YouTube Resolver] No suitable video format found');
      return null;
    }

    console.log('[YouTube Resolver] Selected format:', {
      formatId: chosenVideo.format_id,
      quality: `${chosenVideo.height}p`,
      ext: chosenVideo.ext,
      hasAudio: chosenVideo.acodec !== 'none',
      hasVideo: chosenVideo.vcodec !== 'none',
      filesize: chosenVideo.filesize ? `${(chosenVideo.filesize / 1024 / 1024).toFixed(2)}MB` : 'unknown'
    });

    // Get best audio if video-only format is selected
    let audioUrl = null;
    if (chosenVideo.acodec === 'none' && bestAudioOnly) {
      audioUrl = bestAudioOnly.url;
      console.log('[YouTube Resolver] Best audio format:', {
        formatId: bestAudioOnly.format_id,
        bitrate: bestAudioOnly.abr || bestAudioOnly.tbr
      });
    }

    // For proxy, prefer muxed format for better compatibility
    const proxyFormat = bestMuxed || chosenVideo;

    // Extract expiry timestamp from URL
    let expiresAt = null;
    try {
      const urlParams = new URLSearchParams(chosenVideo.url.split('?')[1]);
      const expireTimestamp = urlParams.get('expire');
      if (expireTimestamp) {
        expiresAt = new Date(parseInt(expireTimestamp) * 1000).toISOString();
      }
    } catch (err) {
      // Ignore parsing errors
    }

    // Default expiry: 5 hours from now if not specified
    if (!expiresAt) {
      expiresAt = new Date(Date.now() + CACHE_TTL).toISOString();
    }

    const result = {
      // RECOMMENDED: Use directUrl in VR app with proper headers
      directUrl: chosenVideo.url,
      directAudioUrl: audioUrl,

      // FALLBACK: Proxied URLs (not recommended for 30+ devices)
      playableUrl: generateProxiedUrl(proxyFormat.url),
      audioUrl: audioUrl ? generateProxiedUrl(audioUrl) : null,

      // HLS/DASH manifest URLs (best for streaming)
      hlsManifestUrl: info.manifest_url || null,
      dashManifestUrl: null, // yt-dlp doesn't provide DASH separately

      // Quality info
      qualityHeight: chosenVideo.height,
      qualityLabel: `${chosenVideo.height}p`,
      itag: chosenVideo.format_id,
      mimeType: `${chosenVideo.video_ext || chosenVideo.ext}/mp4`,
      hasAudio: chosenVideo.acodec !== 'none',
      hasVideo: chosenVideo.vcodec !== 'none',
      isVideoOnly: chosenVideo.acodec === 'none',

      // Proxy format info
      proxyQualityHeight: proxyFormat.height,
      proxyQualityLabel: `${proxyFormat.height}p`,
      proxyHasAudio: proxyFormat.acodec !== 'none',

      expiresAt: expiresAt,
      bitrate: chosenVideo.tbr || chosenVideo.vbr || null,

      // Headers required for direct playback
      requiredHeaders: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com'
      }
    };

    // Cache the result
    const cacheExpiry = new Date(expiresAt).getTime();
    urlCache.set(cacheKey, {
      data: result,
      expiresAt: cacheExpiry
    });

    console.log('[YouTube Resolver] Cached result until:', expiresAt);
    console.log('[YouTube Resolver] ✓ Successfully resolved video');

    return result;

  } catch (err) {
    console.error('[YouTube Resolver] Error:', err.message);
    console.error('[YouTube Resolver] Stack:', err.stack);

    // Check for common errors
    if (err.message.includes('Video unavailable')) {
      console.error('[YouTube Resolver] Video is unavailable or private');
    } else if (err.message.includes('Sign in')) {
      console.error('[YouTube Resolver] Bot detection - consider adding cookies');
    }

    return null;
  }
}

module.exports = { resolveYouTubePlayable };