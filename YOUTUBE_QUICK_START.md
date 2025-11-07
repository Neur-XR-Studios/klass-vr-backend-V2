# YouTube Streaming - Quick Start Guide

## What Changed?

Switched from **InnerTube API** to **yt-dlp** for YouTube URL resolution.

### Why?
- ✅ More reliable on production servers
- ✅ Better handles YouTube's bot detection
- ✅ Returns direct Google Video CDN URLs
- ✅ Actively maintained and updated

---

## Server Setup (Required)

### 1. Install yt-dlp

**On Ubuntu Server:**
```bash
# Install latest version
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verify
yt-dlp --version
```

**On macOS (Development):**
```bash
brew install yt-dlp
```

---

## Optional: Add Cookies (If You Get Bot Errors)

### Method 1: Use Browser Cookies (Easiest)

Add to your `.env` file:
```bash
YOUTUBE_COOKIE="chrome"
```

That's it! yt-dlp will automatically use Chrome's cookies.

### Method 2: Manual Cookie File

If Method 1 doesn't work:
1. Install browser extension: "Get cookies.txt LOCALLY"
2. Visit YouTube while logged in
3. Export cookies to a file
4. Add to `.env`:
```bash
YOUTUBE_COOKIE="/path/to/cookies.txt"
```

---

## Deploy to Server

### 1. SSH into your server
```bash
ssh ubuntu@your-server-ip
```

### 2. Install yt-dlp (see above)

### 3. Update code
```bash
cd /path/to/klass-vr-backend-V2
git pull origin main
```

### 4. Restart PM2
```bash
pm2 restart app
```

### 5. Check logs
```bash
pm2 logs app --lines 50
```

Look for:
```
[YouTube Resolver] ✓ Video resolved: Video Title
[YouTube Resolver] Selected muxed format: 137 1080p mp4
[YouTube Resolver] ✓ Successfully resolved video
```

---

## Testing

### Local Test
```bash
curl http://localhost:3000/v1/experience
```

### Production Test
```bash
curl https://api.klassdraw.com/v1/experience
```

Check the response for `youTubeResolved` object with:
- `directUrl` - Google Video streaming URL
- `playableUrl` - Proxied URL
- `qualityLabel` - Video quality (e.g., "1080p")

---

## Troubleshooting

### Error: "yt-dlp: command not found"
**Fix:** Install yt-dlp on the server (see Server Setup above)

### Error: "Sign in to confirm you're not a bot"
**Fix:** Add `YOUTUBE_COOKIE="chrome"` to `.env` and restart

### Error: "No playable URL found"
**Reasons:**
- Video is private/deleted
- Video is region-restricted
- Need cookies for age-restricted content

**Fix:** Add browser cookies to `.env`

---

## Important Notes

1. **First request is slow** (~3-5 seconds) - subsequent requests use cache (5 hours)
2. **Cookies are optional** - only needed if you get bot detection errors
3. **Results are cached** - same video won't be fetched twice within 5 hours
4. **Works without auth** - yt-dlp is smart enough to bypass most blocks

---

## Need More Details?

See `YOUTUBE_SETUP.md` for comprehensive documentation.
