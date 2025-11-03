const catchAsync = require('../utils/catchAsync');
const axios = require('axios');

// Track active proxy connections
let activeProxyConnections = 0;
const MAX_PROXY_CONNECTIONS = 10; // Limit concurrent proxied streams

/**
 * Proxy YouTube video stream with proper headers to bypass 403 errors
 * WARNING: This endpoint is not designed for production use with 30+ devices.
 * Use directUrl with proper headers in your VR app instead.
 */
const proxyYouTubeStream = catchAsync(async (req, res) => {
  // Enforce connection limit
  if (activeProxyConnections >= MAX_PROXY_CONNECTIONS) {
    console.warn('[YouTube Proxy] Connection limit reached:', activeProxyConnections);
    return res.status(503).send({ 
      error: 'Proxy server overloaded. Use directUrl with proper headers instead.',
      hint: 'See youTubeResolved.requiredHeaders in /v1/experience response'
    });
  }
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).send({ error: 'Missing url parameter' });
  }

  try {
    activeProxyConnections++;
    console.log('[YouTube Proxy] Active connections:', activeProxyConnections);
    
    // Set up proper headers for YouTube (mimic real browser as closely as possible)
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Referer': 'https://www.youtube.com/watch',
      'Origin': 'https://www.youtube.com',
      'Sec-Fetch-Dest': 'video',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
      'Connection': 'keep-alive',
    };

    // Handle range requests for seeking
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await axios({
      method: 'GET',
      url: decodeURIComponent(url),
      headers,
      responseType: 'stream',
      maxRedirects: 5,
      timeout: 30000, // 30 second timeout
    });

    // Forward headers from YouTube response
    res.set({
      'Content-Type': response.headers['content-type'] || 'video/mp4',
      'Content-Length': response.headers['content-length'],
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    });

    if (response.headers['content-range']) {
      res.status(206);
      res.set('Content-Range', response.headers['content-range']);
    }

    // Pipe the video stream
    response.data.pipe(res);

    // Cleanup on connection end
    const cleanup = () => {
      activeProxyConnections--;
      console.log('[YouTube Proxy] Connection closed. Active:', activeProxyConnections);
    };

    // Handle stream errors
    response.data.on('error', (error) => {
      console.error('[YouTube Proxy] Stream error:', error);
      cleanup();
      if (!res.headersSent) {
        res.status(500).send({ error: 'Stream error' });
      }
    });

    // Handle client disconnect
    res.on('close', cleanup);
    res.on('finish', cleanup);

  } catch (error) {
    activeProxyConnections--;
    console.error('[YouTube Proxy] Error:', error.message);
    if (!res.headersSent) {
      res.status(500).send({ error: 'Failed to proxy video stream' });
    }
  }
});

module.exports = {
  proxyYouTubeStream,
};
