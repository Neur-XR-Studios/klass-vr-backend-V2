# Fix: "Sign in to confirm you're not a bot" Error

## Problem
YouTube is blocking video downloads with this error:
```
ERROR: [youtube] Sign in to confirm you're not a bot
```

## Solution (Required)

### Quick Fix - Browser Cookies

**1. Update `.env` file:**
```bash
nano /home/ubuntu/klass-vr/klass-vr-backend-V2/.env
```

**2. Add this line:**
```bash
YOUTUBE_COOKIE=chrome
```

**3. Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

**4. Restart server:**
```bash
pm2 restart app
```

**5. Test it:**
```bash
# Watch logs
pm2 logs app | grep YouTube

# Should see:
# [YouTube Download] Using cookies from browser: chrome
```

## How It Works

The `YOUTUBE_COOKIE=chrome` setting tells yt-dlp to:
1. Read cookies from your Chrome browser on the server
2. Use those cookies (with your YouTube login) to download videos
3. Bypass bot detection

## Alternative Browsers

You can use other browsers if Chrome isn't installed:

```bash
YOUTUBE_COOKIE=firefox
# or
YOUTUBE_COOKIE=edge
# or
YOUTUBE_COOKIE=safari
```

## If Server Has No Browser

If your EC2 server doesn't have a browser installed:

### Option 1: Export cookies from your local machine

1. **On your local computer:**
   - Install Chrome extension: "Get cookies.txt LOCALLY"
   - Go to youtube.com (logged in)
   - Click extension → Export
   - Save as `youtube-cookies.txt`

2. **Upload to server:**
   ```bash
   scp youtube-cookies.txt ubuntu@your-server:/home/ubuntu/klass-vr/klass-vr-backend-V2/
   ```

3. **Update `.env`:**
   ```bash
   YOUTUBE_COOKIE=/home/ubuntu/klass-vr/klass-vr-backend-V2/youtube-cookies.txt
   ```

4. **Restart:**
   ```bash
   pm2 restart app
   ```

### Option 2: Install Chrome on server (Ubuntu)

```bash
# Install Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb -y

# Login to YouTube using Chrome
google-chrome --no-sandbox

# Set .env
YOUTUBE_COOKIE=chrome

# Restart
pm2 restart app
```

## Verification

After setting `YOUTUBE_COOKIE`, create a new content with YouTube URL and check logs:

```bash
pm2 logs app --lines 50 | grep -A 5 "YouTube Download"
```

**Success looks like:**
```
[YouTube Download] Starting download for: https://youtu.be/...
[YouTube Download] Using cookies from browser: chrome
[YouTube Download] ✓ Download complete: 45.23 MB
[S3 Upload] ✓ Upload complete
```

**Failure looks like:**
```
[YouTube Download] Starting download for: https://youtu.be/...
ERROR: [youtube] Sign in to confirm you're not a bot
```

## Summary

**The fix is simple:**
1. Add `YOUTUBE_COOKIE=chrome` to `.env`
2. Restart: `pm2 restart app`
3. Done! ✅

This uses your browser's YouTube login to authenticate downloads and bypass bot detection.
