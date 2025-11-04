const ytdl = require('@distube/ytdl-core');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

// In-memory cache for resolved YouTube URLs (TTL: 6 hours)
const urlCache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Cleanup old player-script.js files created by ytdl-core
function cleanupPlayerScripts() {
  try {
    const files = fs.readdirSync(path.join(__dirname, '..', '..'));
    const now = Date.now();
    
    files.forEach(file => {
      if (file.endsWith('-player-script.js')) {
        const filePath = path.join(__dirname, '..', '..', file);
        const stats = fs.statSync(filePath);
        
        // Delete files older than 1 hour
        if (now - stats.mtimeMs > 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
          console.log('[YouTube Resolver] Cleaned up old player script:', file);
        }
      }
    });
  } catch (err) {
    console.error('[YouTube Resolver] Cleanup error:', err.message);
  }
}

// Run cleanup on startup and every 30 minutes
cleanupPlayerScripts();
setInterval(cleanupPlayerScripts, 30 * 60 * 1000);

/**
 * Generate proxied URL to avoid 403 errors
 * WARNING: Only use for testing/fallback. Not suitable for production with 30+ devices.
 */
function generateProxiedUrl(directUrl) {
  // Use production URL if in production, otherwise localhost
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

/**
 * Resolve a YouTube URL to a directly playable URL at the highest available quality.
 * Strategy:
 * - Ask yt-dlp for full formats list (JSON)
 * - Prefer the highest height format
 *   - Prefer HLS/DASH manifest or HTTPS direct video URLs
 *   - Prefer mp4 container when possible for broader player support
 * - Fall back to best overall if height not present
 * Returns minimal fields needed by clients to play and display quality.
 *
 * @param {string} url
 * @returns {Promise<{ playableUrl: string, qualityHeight?: number, formatId?: string, ext?: string, protocol?: string } | null>}
 */
async function resolveYouTubePlayable(url) {
  try {
    // Clean expired cache periodically
    if (Math.random() < 0.1) cleanExpiredCache(); // 10% chance on each call
    
    // Check cache first
    const cacheKey = url.replace(/[?&](si|feature)=[^&]*/g, ''); // Normalize URL
    const cached = urlCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log('[YouTube Resolver] Returning cached result for:', cacheKey);
      return cached.data;
    }
    
    console.log('[YouTube Resolver] Attempting to resolve:', url);

    const normalizeToWatch = (u) => {
      try {
        const parsed = new URL(u);
        if (parsed.hostname.includes('youtu.be')) {
          const id = parsed.pathname.replace('/', '');
          const query = parsed.searchParams;
          const watch = new URL('https://www.youtube.com/watch');
          if (id) watch.searchParams.set('v', id);
          for (const [k, v] of query.entries()) {
            if (k !== 'v') watch.searchParams.set(k, v);
          }
          return watch.toString();
        }
        return u;
      } catch (_) {
        return u;
      }
    };

    const targetUrl = normalizeToWatch(url);

    const defaultUA = (config.youtube && config.youtube.userAgent) || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const altUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    const clientVersion = '2.20241103.00.00';

    const makeHeaders = (ua) => {
      const h = {
        'User-Agent': ua,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': clientVersion,
      };
      if (config.youtube && config.youtube.cookie) h['Cookie'] = config.youtube.cookie;
      if (config.youtube && config.youtube.identityToken) h['X-YouTube-Identity-Token'] = config.youtube.identityToken;
      return h;
    };

    let info;
    let lastErr;
    const attempts = [makeHeaders(defaultUA), makeHeaders(altUA)];
    for (let i = 0; i < attempts.length; i++) {
      try {
        info = await ytdl.getInfo(targetUrl, { requestOptions: { headers: attempts[i] } });
        break;
      } catch (e) {
        lastErr = e;
        const msg = (e && e.message) || '';
        if (msg.includes('Sign in to confirm you’re not a bot')) {
          continue;
        }
      }
    }
    if (!info) throw lastErr || new Error('Failed to fetch video info');
    
    console.log('[YouTube Resolver] Info fetched. Video title:', info.videoDetails?.title);
    const formats = info.formats || [];
    console.log('[YouTube Resolver] Found formats count:', formats.length);
    
    if (!formats.length) {
      console.warn('[YouTube Resolver] No formats available');
      return null;
    }

    // Separate muxed (audio+video), video-only, and audio-only formats
    const muxed = formats.filter(f => f.hasAudio && f.hasVideo && f.url);
    const videoOnly = formats.filter(f => f.hasVideo && !f.hasAudio && f.url);
    const audioOnly = formats.filter(f => f.hasAudio && !f.hasVideo && f.url);
    
    console.log('[YouTube Resolver] Muxed:', muxed.length, 'Video-only:', videoOnly.length, 'Audio-only:', audioOnly.length);

    const byQuality = (a, b) => {
      const ha = a.height || 0;
      const hb = b.height || 0;
      if (hb !== ha) return hb - ha;
      // prefer mp4
      const score = (f) => (typeof f.mimeType === 'string' && f.mimeType.includes('mp4')) ? 2 : 0;
      const scoreA = score(a);
      const scoreB = score(b);
      if (scoreB !== scoreA) return scoreB - scoreA;
      // prefer higher bitrate
      const ba = a.bitrate || 0;
      const bb = b.bitrate || 0;
      return bb - ba;
    };

    const pick = (arr) => arr.length > 0 ? arr.slice().sort(byQuality)[0] : null;

    const bestMuxed = pick(muxed);
    const bestVideoOnly = pick(videoOnly);
    
    // Always prefer highest quality available (even if video-only)
    // Video-only formats typically have much higher quality (1440p, 2160p)
    const muxedHeight = bestMuxed ? (bestMuxed.height || 0) : 0;
    const videoOnlyHeight = bestVideoOnly ? (bestVideoOnly.height || 0) : 0;
    
    const chosen = videoOnlyHeight >= muxedHeight ? bestVideoOnly : bestMuxed;
    
    if (!chosen) {
      console.warn('[YouTube Resolver] No suitable format found');
      return null;
    }
    
    console.log('[YouTube Resolver] Selected format:', {
      itag: chosen.itag,
      quality: chosen.qualityLabel,
      height: chosen.height,
      hasAudio: chosen.hasAudio,
      hasVideo: chosen.hasVideo
    });

    // Check for HLS/DASH manifest URLs for better streaming compatibility
    const hlsManifestUrl = info.formats.find(f => f.isHLS && f.url)?.url;
    const dashManifestUrl = info.formats.find(f => f.isDashMPD && f.url)?.url;
    
    // If video-only format is selected, provide best audio stream URL
    let bestAudioUrl = null;
    if (chosen.hasVideo && !chosen.hasAudio && audioOnly.length > 0) {
      const bestAudio = audioOnly.slice().sort((a, b) => {
        const ba = a.bitrate || a.audioBitrate || 0;
        const bb = b.bitrate || b.audioBitrate || 0;
        return bb - ba;
      })[0];
      bestAudioUrl = bestAudio?.url || null;
      console.log('[YouTube Resolver] Best audio format:', {
        itag: bestAudio?.itag,
        bitrate: bestAudio?.bitrate || bestAudio?.audioBitrate
      });
    }
    
    // Extract expiry from URL for client-side refresh logic
    const urlParams = new URLSearchParams(chosen.url.split('?')[1]);
    const expireTimestamp = urlParams.get('expire');

    // For proxy URL, prefer muxed format (works better through proxy, even if lower quality)
    const proxyFormat = bestMuxed || chosen;
    
    const result = {
      // RECOMMENDED: Use directUrl in VR app with proper headers (see documentation)
      directUrl: chosen.url,
      directAudioUrl: bestAudioUrl,
      
      // FALLBACK: Proxied URLs (not recommended for 30+ devices - performance issue)
      // Uses muxed format if available for better browser compatibility
      playableUrl: generateProxiedUrl(proxyFormat.url),
      audioUrl: (proxyFormat.hasVideo && !proxyFormat.hasAudio && bestAudioUrl) 
        ? generateProxiedUrl(bestAudioUrl) 
        : null,
      
      // BEST FOR STREAMING: Use these in compatible players
      hlsManifestUrl: hlsManifestUrl || null,
      dashManifestUrl: dashManifestUrl || null,
      
      // Quality info (for highest quality format)
      qualityHeight: chosen.height,
      qualityLabel: chosen.qualityLabel,
      itag: chosen.itag,
      mimeType: chosen.mimeType,
      hasAudio: !!chosen.hasAudio,
      hasVideo: !!chosen.hasVideo,
      isVideoOnly: !!(chosen.hasVideo && !chosen.hasAudio),
      
      // Proxy format info (might be different from direct)
      proxyQualityHeight: proxyFormat.height,
      proxyQualityLabel: proxyFormat.qualityLabel,
      proxyHasAudio: !!proxyFormat.hasAudio,
      
      expiresAt: expireTimestamp ? new Date(parseInt(expireTimestamp) * 1000).toISOString() : null,
      bitrate: chosen.bitrate || null,
      
      // Headers required for direct playback (use in VR app)
      requiredHeaders: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com'
      }
    };
    
    // Cache the result (TTL based on URL expiry or default 6 hours)
    const cacheExpiry = expireTimestamp 
      ? Math.min(parseInt(expireTimestamp) * 1000, Date.now() + CACHE_TTL)
      : Date.now() + CACHE_TTL;
    
    urlCache.set(cacheKey, {
      data: result,
      expiresAt: cacheExpiry
    });
    
    console.log('[YouTube Resolver] Cached result until:', new Date(cacheExpiry).toISOString());
    
    return result;
  } catch (err) {
    console.error('[YouTube Resolver] Error:', err.message);
    console.error('[YouTube Resolver] Stack:', err.stack);
    return null;
  }
}

module.exports = { resolveYouTubePlayable };
