const axios = require('axios');
const config = require('../config/config');

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
 * Use YouTube's InnerTube API (Android client)
 * This bypasses most bot detection
 */
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

    console.log('[YouTube Resolver] Attempting to resolve:', videoId);

    // Use Android client - most reliable, doesn't require authentication
    const response = await axios.post(
      'https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w',
      {
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '19.09.37',
            androidSdkVersion: 30,
            userAgent: 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
            hl: 'en',
            timeZone: 'UTC',
            utcOffsetMinutes: 0
          }
        },
        videoId: videoId,
        playbackContext: {
          contentPlaybackContext: {
            html5Preference: 'HTML5_PREF_WANTS'
          }
        },
        contentCheckOk: true,
        racyCheckOk: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
          'X-YouTube-Client-Name': '3',
          'X-YouTube-Client-Version': '19.09.37'
        }
      }
    );

    const data = response.data;

    if (!data.streamingData || !data.streamingData.formats) {
      console.error('[YouTube Resolver] No streaming data available');
      return null;
    }

    console.log('[YouTube Resolver] ✓ Video resolved:', data.videoDetails?.title);

    const formats = [
      ...(data.streamingData.formats || []),
      ...(data.streamingData.adaptiveFormats || [])
    ];

    console.log('[YouTube Resolver] Found', formats.length, 'formats');

    // Separate formats
    const muxed = formats.filter(f => f.mimeType?.includes('video') && f.audioQuality);
    const videoOnly = formats.filter(f => f.mimeType?.includes('video') && !f.audioQuality);
    const audioOnly = formats.filter(f => f.mimeType?.includes('audio'));

    console.log('[YouTube Resolver] Muxed:', muxed.length, 'Video-only:', videoOnly.length, 'Audio-only:', audioOnly.length);

    // Sort by quality
    const sortByQuality = (a, b) => {
      const ha = a.height || 0;
      const hb = b.height || 0;
      if (hb !== ha) return hb - ha;
      const ba = a.bitrate || 0;
      const bb = b.bitrate || 0;
      return bb - ba;
    };

    const bestMuxed = muxed.length > 0 ? muxed.sort(sortByQuality)[0] : null;
    const bestVideoOnly = videoOnly.length > 0 ? videoOnly.sort(sortByQuality)[0] : null;
    const bestAudioOnly = audioOnly.length > 0
      ? audioOnly.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
      : null;

    const muxedHeight = bestMuxed?.height || 0;
    const videoOnlyHeight = bestVideoOnly?.height || 0;
    const chosenVideo = videoOnlyHeight >= muxedHeight ? bestVideoOnly : bestMuxed;

    if (!chosenVideo) {
      console.error('[YouTube Resolver] No suitable format found');
      return null;
    }

    console.log('[YouTube Resolver] Selected format:', {
      quality: `${chosenVideo.height}p`,
      mimeType: chosenVideo.mimeType,
      hasAudio: !!chosenVideo.audioQuality
    });

    let audioUrl = null;
    if (!chosenVideo.audioQuality && bestAudioOnly) {
      audioUrl = bestAudioOnly.url;
    }

    const proxyFormat = bestMuxed || chosenVideo;

    // Extract expiry
    let expiresAt = null;
    try {
      const urlParams = new URLSearchParams(chosenVideo.url.split('?')[1]);
      const expireTimestamp = urlParams.get('expire');
      if (expireTimestamp) {
        expiresAt = new Date(parseInt(expireTimestamp) * 1000).toISOString();
      }
    } catch (err) {
      // Ignore
    }

    if (!expiresAt) {
      expiresAt = new Date(Date.now() + CACHE_TTL).toISOString();
    }

    const result = {
      directUrl: chosenVideo.url,
      directAudioUrl: audioUrl,
      playableUrl: generateProxiedUrl(proxyFormat.url),
      audioUrl: audioUrl ? generateProxiedUrl(audioUrl) : null,
      hlsManifestUrl: data.streamingData.hlsManifestUrl || null,
      dashManifestUrl: data.streamingData.dashManifestUrl || null,
      qualityHeight: chosenVideo.height,
      qualityLabel: chosenVideo.qualityLabel || `${chosenVideo.height}p`,
      itag: chosenVideo.itag,
      mimeType: chosenVideo.mimeType,
      hasAudio: !!chosenVideo.audioQuality,
      hasVideo: !!chosenVideo.height,
      isVideoOnly: !chosenVideo.audioQuality,
      proxyQualityHeight: proxyFormat.height,
      proxyQualityLabel: proxyFormat.qualityLabel || `${proxyFormat.height}p`,
      proxyHasAudio: !!proxyFormat.audioQuality,
      expiresAt: expiresAt,
      bitrate: chosenVideo.bitrate || null,
      requiredHeaders: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com'
      }
    };

    const cacheExpiry = new Date(expiresAt).getTime();
    urlCache.set(cacheKey, {
      data: result,
      expiresAt: cacheExpiry
    });

    console.log('[YouTube Resolver] ✓ Successfully resolved video');
    return result;

  } catch (err) {
    console.error('[YouTube Resolver] Error:', err.message);
    if (err.response) {
      console.error('[YouTube Resolver] Response:', err.response.status, err.response.data);
    }
    return null;
  }
}

module.exports = { resolveYouTubePlayable };