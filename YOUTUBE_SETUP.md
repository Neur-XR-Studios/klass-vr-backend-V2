# YouTube URL Resolution Setup

This document explains how the YouTube URL resolution works and how to configure it for optimal performance on production servers.

## Overview

The YouTube resolution service converts standard YouTube URLs into direct streaming URLs that can be played in Unity or other video players. It uses **yt-dlp** (a robust YouTube downloader) to fetch video metadata and extract direct Google Video streaming URLs.

## How It Works

The service uses the `yt-dlp` command-line tool to:

1. Fetch video metadata in JSON format
2. Parse available formats (muxed, video-only, audio-only)
3. Select the best quality muxed format (video + audio in one stream)
4. Return direct Google Video CDN URLs
5. Cache results for 5 hours to reduce API calls

## Why yt-dlp?

- **More Reliable**: Actively maintained and updated to handle YouTube's changes
- **Better Bot Detection Handling**: Uses sophisticated techniques to avoid blocks
- **Cookie Support**: Can use browser cookies for authentication
- **Multiple Extractors**: Supports different YouTube client types (TV, Android, etc.)

## Prerequisites

**Install yt-dlp on your server:**

```bash
# macOS (via Homebrew)
brew install yt-dlp

# Ubuntu/Debian
sudo apt install yt-dlp
# or for latest version:
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verify installation
yt-dlp --version
```

## Environment Variables (Optional)

The service supports optional environment variables for enhanced reliability:

### Option 1: Use Browser Cookies (Recommended)

```bash
# Automatically extract cookies from your browser
YOUTUBE_COOKIE="chrome"  # or "firefox", "safari", "edge"
```

### Option 2: Use Cookie File

```bash
# Path to Netscape cookie file
YOUTUBE_COOKIE="/path/to/youtube-cookies.txt"
```

### Option 3: Custom User Agent

```bash
YOUTUBE_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

**Note:** The identity token is no longer needed with yt-dlp.

### How to Get Browser Cookies (Easiest Method)

**Using yt-dlp's built-in browser cookie extraction:**

1. Make sure you're logged into YouTube in your browser
2. Set the environment variable:

```bash
# For Chrome
YOUTUBE_COOKIE="chrome"

# For Firefox
YOUTUBE_COOKIE="firefox"

# For Safari
YOUTUBE_COOKIE="safari"
```

yt-dlp will automatically extract cookies from your browser. No manual copying needed!

### How to Create a Cookie File (Manual Method)

If the automatic method doesn't work, you can create a cookie file:

1. Install a browser extension like "Get cookies.txt LOCALLY"
2. Visit YouTube (while logged in)
3. Click the extension and export cookies
4. Save as `youtube-cookies.txt`
5. Set environment variable:

```bash
YOUTUBE_COOKIE="/absolute/path/to/youtube-cookies.txt"
```

## Testing

After setting up, test the `/v1/experience` endpoint:

```bash
curl -H "device-id: YOUR_DEVICE_ID" http://localhost:3000/v1/experience
```

### Expected Logs

#### Successful Resolution

```
[YouTube Resolver] Attempting to resolve: https://youtu.be/nV_hd6bLXmw
[YouTube Resolver] Executing yt-dlp with args: --dump-single-json --no-check-certificate...
[YouTube Resolver] ✓ Video resolved: Video Title Here
[YouTube Resolver] Total formats found: 25
[YouTube Resolver] Muxed: 5 | Video-only: 15 | Audio-only: 5
[YouTube Resolver] Selected muxed format: 137 1080p mp4
[YouTube Resolver] ✓ Successfully resolved video
```

## Response Structure

The API returns:
```json
{
  "youTubeResolved": {
    "directUrl": "https://rr5---sn-xxx.googlevideo.com/...",
    "playableUrl": "https://api.klassdraw.com/v1/youtube-proxy/stream?url=...",
    "directAudioUrl": "https://rr5---sn-xxx.googlevideo.com/...",
    "hlsManifestUrl": "https://manifest.googlevideo.com/...",
    "qualityHeight": 1080,
    "qualityLabel": "1080p",
    "hasAudio": true,
    "expiresAt": "2025-11-05T18:00:00.000Z",
    "requiredHeaders": {
      "User-Agent": "Mozilla/5.0...",
      "Referer": "https://www.youtube.com/",
      "Origin": "https://www.youtube.com"
    }
  }
}
```

## Usage Recommendations

### For VR App (Recommended)
Use `directUrl` with the provided `requiredHeaders`:
- Best performance
- No server bandwidth usage
- Direct streaming from Google servers

### For Web Browser (Fallback)
Use `playableUrl`:
- Goes through your proxy server
- Works in browsers with CORS restrictions
- Not recommended for 30+ concurrent users

### For Advanced Players
Use `hlsManifestUrl`:
- Adaptive bitrate streaming
- Best quality selection
- Requires HLS-compatible player

## Troubleshooting

### "Sign in to confirm you're not a bot" Error

**Cause:** YouTube's bot detection is blocking yt-dlp requests.

**Solutions:**

1. **Use browser cookies (easiest):**
   ```bash
   YOUTUBE_COOKIE="chrome"
   ```

2. **Update yt-dlp to latest version:**
   ```bash
   # Ubuntu/macOS
   sudo yt-dlp -U
   
   # or reinstall
   brew upgrade yt-dlp
   ```

3. **Use TV extractor (sometimes bypasses detection):**
   The service can be extended to support this via environment variable.

### "yt-dlp: command not found"

**Cause:** yt-dlp is not installed on the server.

**Solution:** Install yt-dlp (see Prerequisites section above).

### No Playable URL Found

**Causes:**
- Video is region-restricted
- Video is age-restricted (needs authentication)
- Video is private or deleted
- Video uses DRM protection

**Solution:** Add browser cookies to authenticate requests.

### Slow Resolution

**Cause:** yt-dlp fetches metadata every time.

**Solution:** Results are cached for 5 hours. First request will be slow, subsequent requests use cache.

### "All client strategies failed"
- The video might be region-restricted
- Try adding YouTube cookies to `.env`
- Check if the video is private or deleted

### "No streaming data available"
- YouTube may have changed their API
- Check server logs for specific error details
- Verify the YouTube URL is valid

### Still not working?
The service automatically tries 3 different strategies, so if all fail:
1. Check the video is publicly accessible
2. Try adding fresh YouTube cookies
3. Check server logs for specific errors
4. Verify network connectivity to youtube.com

## Security Notes

- **Don't commit cookies to Git** - add `.env` to `.gitignore`
- Cookies expire after ~6 months - update them periodically
- Only use cookies from your own YouTube account
