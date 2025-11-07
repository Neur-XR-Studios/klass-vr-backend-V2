/**
 * ⚠️ DEPRECATED - DO NOT USE THIS FILE ⚠️
 * 
 * This file is deprecated as of 2025-11-07.
 * 
 * Use youtubeDownload.service.js instead for:
 * - Permanent S3 storage (no expiration)
 * - 4K quality support
 * - Better reliability
 * - No bot detection issues
 * 
 * This file remains for reference only.
 * It has been removed from all active code paths.
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const config = require('../config/config');

const execFilePromise = promisify(execFile);

// In-memory cache for resolved YouTube URLs (TTL: 5 hours to be safe)
const urlCache = new Map();
const CACHE_TTL = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

/**
 * Generate proxied URL to avoid 403 errors
 */
function generateProxiedUrl(directUrl) {
  const baseUrl = config.env === 'production'
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
    }
  }
}

setInterval(cleanExpiredCache, 30 * 60 * 1000);

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
 * Build yt-dlp arguments from environment variables
 */
function buildYtDlpArgs() {
  const args = [];
  
  // Add cookie support if environment variable is set
  if (config.youtube?.cookie) {
    const cookieValue = config.youtube.cookie.trim();
    
    // Check if it's a browser name (e.g., "chrome", "firefox")
    if (cookieValue && !cookieValue.includes('=') && !cookieValue.startsWith('/')) {
      args.push('--cookies-from-browser', cookieValue);
      console.log('[YouTube Resolver] Using cookies from browser:', cookieValue);
    }
    // Check if it's a file path
    else if (cookieValue.startsWith('/') || cookieValue.startsWith('./')) {
      args.push('--cookies', cookieValue);
      console.log('[YouTube Resolver] Using cookie file:', cookieValue);
    }
  }
  
  // Add user agent if specified
  if (config.youtube?.userAgent) {
    args.push('--user-agent', config.youtube.userAgent);
  }
  
  return args;
}

async function resolveYouTubePlayable(url) {
  try {
    if (Math.random() < 0.1) cleanExpiredCache();

    const videoId = extractVideoId(url);
    if (!videoId) {
      console.error('[YouTube Resolver] Invalid YouTube URL');
      return null;
    }

    const cacheKey = videoId;
    const cached = urlCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log('[YouTube Resolver] Returning cached result for:', videoId);
      return cached.data;
    }

    console.log('[YouTube Resolver] Attempting to resolve:', url);

    // Build yt-dlp command arguments
    const baseArgs = [
      '--dump-single-json',
      '--no-check-certificate',
      '--no-warnings',
      '--no-playlist',
      '--prefer-free-formats',
      '--format', 'bestvideo*+bestaudio/best',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    // Add environment-based arguments (cookies, etc.)
    const envArgs = buildYtDlpArgs();
    const args = [...baseArgs, ...envArgs, url];

    console.log('[YouTube Resolver] Executing yt-dlp with args:', args.slice(0, -1).join(' '));

    // Execute yt-dlp
    const { stdout, stderr } = await execFilePromise('yt-dlp', args, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 30000 // 30 second timeout
    });

    if (stderr && stderr.trim()) {
      console.warn('[YouTube Resolver] yt-dlp stderr:', stderr.trim());
    }

    // Parse JSON metadata
    const metadata = JSON.parse(stdout);
    console.log('[YouTube Resolver] ✓ Video resolved:', metadata.title || videoId);

    // Helper functions
    const isHls = f => (f && (f.protocol || '')).includes('m3u8');
    const heightOf = f => f?.height || 0;
    const byHeightDesc = (a, b) => (heightOf(b) - heightOf(a));

    // Filter formats
    const formats = Array.isArray(metadata.formats) ? metadata.formats : [];
    console.log('[YouTube Resolver] Total formats found:', formats.length);

    // Separate format types (INCLUDE HLS for high quality)
    const hlsFormats = formats.filter(f => f && f.url && isHls(f) && f.vcodec && f.vcodec !== 'none');
    const videoOnly = formats.filter(f => 
      f && f.url && f.vcodec && f.vcodec !== 'none' && 
      (!f.acodec || f.acodec === 'none') && !isHls(f)
    );
    const audioOnly = formats.filter(f => 
      f && f.url && (!f.vcodec || f.vcodec === 'none') && 
      f.acodec && f.acodec !== 'none' && !isHls(f)
    );
    const muxed = formats.filter(f => 
      f && f.url && f.vcodec && f.vcodec !== 'none' && 
      f.acodec && f.acodec !== 'none' && !isHls(f)
    );

    console.log('[YouTube Resolver] HLS:', hlsFormats.length, '| Muxed:', muxed.length, '| Video-only:', videoOnly.length, '| Audio-only:', audioOnly.length);

    // Log all available qualities for debugging
    if (videoOnly.length > 0) {
      const videoQualities = videoOnly.map(f => `${f.format_id}:${heightOf(f)}p`).sort((a, b) => {
        const aHeight = parseInt(a.split(':')[1]);
        const bHeight = parseInt(b.split(':')[1]);
        return bHeight - aHeight;
      }).join(', ');
      console.log('[YouTube Resolver] Available video-only qualities:', videoQualities);
    }

    // Select best format
    let selectedFormat = null;
    let formatType = null;

    // Check max available qualities
    const maxVideoHeight = videoOnly.length > 0 ? Math.max(...videoOnly.map(heightOf)) : 0;
    const maxHlsHeight = hlsFormats.length > 0 ? Math.max(...hlsFormats.map(heightOf)) : 0;
    
    console.log('[YouTube Resolver] Max qualities - Video-only:', maxVideoHeight + 'p', '| HLS:', maxHlsHeight + 'p');

    // Strategy: Prefer 4K quality over HLS format
    // Check if HLS has 4K/2160p
    const hls4K = hlsFormats.find(f => heightOf(f) >= 2160);
    
    // PREFER 4K quality (even if video-only) over lower quality HLS
    if (hls4K) {
      // HLS with 4K - BEST CASE!
      selectedFormat = hls4K;
      formatType = 'hls_4k';
      const resolution = selectedFormat.width && selectedFormat.height 
        ? `${selectedFormat.width}x${selectedFormat.height}` 
        : `${heightOf(selectedFormat)}p`;
      console.log('[YouTube Resolver] ✓ Found HLS with 4K! Format:', selectedFormat.format_id, '-', resolution, 'height=' + heightOf(selectedFormat));
      console.log('[YouTube Resolver] Protocol:', selectedFormat.protocol);
    }
    else if (videoOnly.length > 0 && maxVideoHeight >= 2160) {
      // Video-only 4K (no HLS 4K available)
      selectedFormat = videoOnly.sort(byHeightDesc)[0];
      formatType = 'video_only_4k';
      const resolution = selectedFormat.width && selectedFormat.height 
        ? `${selectedFormat.width}x${selectedFormat.height}` 
        : `${heightOf(selectedFormat)}p`;
      console.log('[YouTube Resolver] Selected 4K video-only format (HLS max is ' + maxHlsHeight + 'p):', selectedFormat.format_id, '-', resolution, 'height=' + heightOf(selectedFormat));
      console.warn('[YouTube Resolver] ⚠ This format is video-only. Audio URL will be provided separately.');
    }
    else if (hlsFormats.length > 0) {
      // HLS without 4K (fallback to best HLS quality)
      const hlsQualities = hlsFormats.map(f => `${f.format_id}:${heightOf(f)}p`).join(', ');
      console.log('[YouTube Resolver] Available HLS qualities:', hlsQualities);
      console.log('[YouTube Resolver] No 4K available. Using best HLS format.');
      
      selectedFormat = hlsFormats.sort(byHeightDesc)[0];
      formatType = 'hls';
      const formatInfo = selectedFormat.format || 'unknown';
      const resolution = selectedFormat.width && selectedFormat.height 
        ? `${selectedFormat.width}x${selectedFormat.height}` 
        : `${heightOf(selectedFormat)}p`;
      console.log('[YouTube Resolver] Selected HLS format (.m3u8):', selectedFormat.format_id, '-', resolution, 'height=' + heightOf(selectedFormat));
      console.log('[YouTube Resolver] Protocol:', selectedFormat.protocol);
    }
    // Fallback to muxed formats (no merging needed)
    else if (muxed.length > 0) {
      // Prefer MP4 muxed formats
      const muxedMp4 = muxed.filter(f => f.ext === 'mp4' || (f.format && f.format.includes('mp4')));
      if (muxedMp4.length > 0) {
        selectedFormat = muxedMp4.sort(byHeightDesc)[0];
      } else {
        selectedFormat = muxed.sort(byHeightDesc)[0];
      }
      formatType = 'muxed';
      console.log('[YouTube Resolver] Selected muxed format:', selectedFormat.format_id, `${heightOf(selectedFormat)}p`, selectedFormat.ext);
    } 
    // Fallback to video-only (high quality available)
    else if (videoOnly.length > 0) {
      selectedFormat = videoOnly.sort(byHeightDesc)[0];
      formatType = 'video_only';
      console.log('[YouTube Resolver] Selected video-only format:', selectedFormat.format_id, `${heightOf(selectedFormat)}p`, selectedFormat.ext);
      console.warn('[YouTube Resolver] ⚠ Selected format has no audio track');
    }
    // Last resort: try any format with URL
    else if (metadata.url) {
      selectedFormat = { url: metadata.url, height: 0, format_id: 'default' };
      formatType = 'fallback';
      console.log('[YouTube Resolver] Using fallback URL from metadata');
    }

    if (!selectedFormat || !selectedFormat.url) {
      console.error('[YouTube Resolver] No playable URL found in metadata');
      return null;
    }

    const directUrl = selectedFormat.url;
    const height = heightOf(selectedFormat);
    const width = selectedFormat.width || 0;
    const qualityLabel = `${height}p` || 'unknown';
    const resolution = width && height ? `${width}x${height}` : qualityLabel;

    // Get best audio URL if video-only format is selected
    let bestAudioUrl = null;
    if (formatType === 'video_only_4k' || formatType === 'video_only') {
      const bestAudio = audioOnly.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
      if (bestAudio) {
        bestAudioUrl = bestAudio.url;
        console.log('[YouTube Resolver] Best audio format:', bestAudio.format_id, 'bitrate:', bestAudio.abr + 'kbps');
      }
    }

    // Extract expiration time from URL
    let expiresAt = new Date(Date.now() + CACHE_TTL);
    try {
      const urlObj = new URL(directUrl);
      const expire = urlObj.searchParams.get('expire');
      if (expire) {
        expiresAt = new Date(parseInt(expire, 10) * 1000);
      }
    } catch (e) {
      // Use default TTL
    }

    // Check if URL is HLS manifest
    const isM3U8 = directUrl.includes('manifest.googlevideo.com') || 
                   directUrl.includes('.m3u8') || 
                   directUrl.includes('hls_playlist') ||
                   formatType === 'hls' ||
                   formatType === 'hls_4k';

    const result = {
      directUrl,
      playableUrl: generateProxiedUrl(directUrl),
      audioUrl: bestAudioUrl, // For 4K video-only formats (null for HLS/muxed)
      qualityHeight: height,
      qualityLabel,
      resolution,
      expiresAt,
      videoId,
      title: metadata.title || 'Unknown',
      duration: metadata.duration || 0,
      formatType, // 'hls_4k', 'video_only_4k', 'hls', 'muxed', 'video_only', 'fallback'
      formatId: selectedFormat.format_id,
      ext: selectedFormat.ext || 'unknown',
      format: selectedFormat.format || `${selectedFormat.format_id} - ${resolution}`,
      hasAudio: formatType !== 'video_only_4k' && formatType !== 'video_only',
      isM3U8, // true if HLS manifest (.m3u8)
      is4K: height >= 2160, // true if 4K/2160p
      protocol: selectedFormat.protocol || 'https'
    };

    // Cache the result
    urlCache.set(cacheKey, {
      data: result,
      expiresAt: expiresAt.getTime()
    });

    const urlType = directUrl.includes('manifest.googlevideo.com') || directUrl.includes('.m3u8') ? 'HLS Manifest (.m3u8)' : 'Direct Video URL';
    console.log('[YouTube Resolver] Selected format from metadata.formats: ext=' + result.ext + ' format=' + result.format + ' height=' + height);
    console.log('[YouTube Resolver] URL Type:', urlType);
    console.log('[YouTube Resolver] Resolved stream URL:', directUrl.substring(0, 150) + '...');
    console.log('[YouTube Resolver] ✓ Successfully resolved video');
    return result;

  } catch (err) {
    console.error('[YouTube Resolver] Error:', err.message);
    if (err.stderr) {
      console.error('[YouTube Resolver] yt-dlp stderr:', err.stderr);
    }
    if (err.code) {
      console.error('[YouTube Resolver] Error code:', err.code);
    }
    console.error('[YouTube Resolver] Stack:', err.stack);
    return null;
  }
}

module.exports = { resolveYouTubePlayable };