# YouTube Video Download System - Setup Guide

## Overview

This system automatically downloads YouTube videos in the background when you create/update content with a YouTube URL. Videos are stored in AWS S3 for reliable, cheap storage.

## How It Works

```
1. POST/PATCH /content with youTubeUrl
   ↓
2. Content saved → Job queued
   ↓
3. Background worker downloads video (yt-dlp + ffmpeg)
   ↓
4. Video uploaded to S3
   ↓
5. Content updated with S3 URL
   ↓
6. Client can use youTubeDownloadedUrl
```

## Prerequisites

### 1. Install yt-dlp on Server

**Ubuntu/EC2:**
```bash
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
yt-dlp --version
```

**macOS (Development):**
```bash
brew install yt-dlp
```

### 2. Install ffmpeg (for merging video+audio)

**Ubuntu/EC2:**
```bash
sudo apt update
sudo apt install ffmpeg -y
ffmpeg -version
```

**macOS:**
```bash
brew install ffmpeg
```

### 3. Create AWS S3 Bucket

1. Go to AWS S3 Console
2. Create new bucket: `klass-vr-videos` (or your preferred name)
3. Region: Same as your EC2 (e.g., `us-east-1`)
4. Settings:
   - Block all public access: **OFF** (or configure CloudFront)
   - Versioning: Optional
   - Encryption: Optional (recommended)
5. Add CORS policy (if accessing from Unity):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 4. Configure IAM Permissions

Ensure your AWS credentials have S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::klass-vr-videos/*"
    }
  ]
}
```

## Environment Variables

Add to your `.env` file:

```bash
# AWS S3 Configuration (already exists)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=klass-vr-videos

# YouTube Download - REQUIRED to avoid bot detection
# Option 1: Use browser cookies (recommended)
YOUTUBE_COOKIE=chrome

# Option 2: Use cookie file
# YOUTUBE_COOKIE=/path/to/youtube-cookies.txt
```

### **Important: YouTube Cookie Setup**

YouTube now requires authentication to download videos. You MUST set `YOUTUBE_COOKIE` to avoid "Sign in to confirm you're not a bot" errors.

**Option 1: Browser Cookies (Easiest)**
```bash
# Use cookies from your logged-in browser
YOUTUBE_COOKIE=chrome    # or firefox, edge, safari
```

This extracts cookies from your browser where you're logged into YouTube.

**Option 2: Export Cookie File**

1. Install browser extension: "Get cookies.txt LOCALLY"
2. Go to youtube.com (logged in)
3. Click extension, export cookies
4. Save as `youtube-cookies.txt` in project root
5. Set: `YOUTUBE_COOKIE=/full/path/to/youtube-cookies.txt`

## API Usage

### 1. Create Content with YouTube URL

**POST** `/v1/content`

```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "youTubeUrl": "https://youtu.be/nV_hd6bLXmw",
  "youTubeStartTimer": "00:00",
  "youTubeEndTimer": "01:30",
  "script": "Sample content",
  "teacherCharacterGender": "male",
  "language": "english"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "youTubeUrl": "https://youtu.be/nV_hd6bLXmw",
  "youTubeDownloadStatus": "pending",
  "youTubeDownloadProgress": 0,
  ...
}
```

### 2. Check Download Status

**GET** `/v1/youtube-download/status/:contentId`

**Response:**
```json
{
  "contentId": "507f1f77bcf86cd799439012",
  "youTubeUrl": "https://youtu.be/nV_hd6bLXmw",
  "downloadStatus": "completed",
  "downloadedUrl": "https://klass-vr-videos.s3.us-east-1.amazonaws.com/youtube-videos/507f1f77bcf86cd799439012/nV_hd6bLXmw.mp4",
  "progress": 100,
  "error": null
}
```

### 3. Check Queue Status

**GET** `/v1/youtube-download/queue`

**Response:**
```json
{
  "queued": 2,
  "processing": 1,
  "jobs": [
    {
      "contentId": "507f1f77bcf86cd799439013",
      "queuedAt": "2025-11-07T12:30:00.000Z"
    }
  ],
  "processingJobs": ["507f1f77bcf86cd799439012"]
}
```

## Download Statuses

| Status | Description |
|--------|-------------|
| `pending` | Queued, waiting to start |
| `downloading` | Downloading from YouTube |
| `downloaded` | Download complete, preparing upload |
| `uploading` | Uploading to S3 |
| `completed` | ✅ Video ready! Use `youTubeDownloadedUrl` |
| `failed` | ❌ Error occurred, check `youTubeDownloadError` |

## Content Model Fields

```javascript
{
  youTubeUrl: String,              // Original YouTube URL
  youTubeStartTimer: String,       // Start time (e.g., "00:30")
  youTubeEndTimer: String,         // End time (e.g., "02:15")
  youTubeDownloadStatus: String,   // Status enum
  youTubeDownloadedUrl: String,    // S3 URL (use this in Unity!)
  youTubeDownloadProgress: Number, // 0-100
  youTubeDownloadError: String,    // Error message if failed
}
```

## Unity Integration

### Before (Old Approach - Problematic)
```csharp
// Used youTubeResolved.directUrl (expired after 6 hours)
videoPlayer.url = content.youTubeResolved.directUrl;
```

### After (New Approach - Reliable)
```csharp
// Use S3 URL (permanent, no expiration)
if (content.youTubeDownloadStatus == "completed") {
    videoPlayer.url = content.youTubeDownloadedUrl;
} else {
    // Show loading or download status
    Debug.Log($"Video downloading: {content.youTubeDownloadProgress}%");
}
```

## Cost Estimation

### AWS S3 Pricing (us-east-1)
- **Storage**: $0.023/GB/month
- **Download (bandwidth)**: $0.09/GB
- **Upload**: FREE

### Example:
- 100 videos × 50MB each = 5GB storage
- **Storage cost**: $0.023 × 5 = **$0.115/month** (~₹10/month)
- **Bandwidth**: 1000 views × 50MB = 50GB = **$4.50/month** (~₹375/month)

### Total: ~$5/month for 100 videos with moderate usage 💰

Compare to streaming services: **Much cheaper!**

## Monitoring

### Server Logs

Watch download progress:
```bash
pm2 logs app | grep "YouTube"
```

Expected logs:
```
[Job Queue] Added job to queue: 507f1f77bcf86cd799439012 | Queue size: 1
[YouTube Download] Starting download for: https://youtu.be/nV_hd6bLXmw
[YouTube Download] ✓ Download complete: /temp-youtube-downloads/xxx.mp4
[S3 Upload] Starting upload: youtube-videos/507f1f77bcf86cd799439012/nV_hd6bLXmw.mp4
[S3 Upload] File size: 45.23 MB
[S3 Upload] ✓ Upload complete: https://klass-vr-videos.s3...
[YouTube Processor] ✓ Processing complete!
```

### Database Query

Check pending downloads:
```javascript
db.contents.find({
  youTubeDownloadStatus: { $in: ['pending', 'downloading', 'uploading'] }
})
```

## Troubleshooting

### Error: "yt-dlp: command not found"
**Fix:** Install yt-dlp on server (see Prerequisites)

### Error: "Sign in to confirm you're not a bot"
This is the most common error. YouTube requires authentication.

**Fix (Required):** Add to `.env`:
```bash
YOUTUBE_COOKIE=chrome
```

Then restart:
```bash
pm2 restart app
```

Verify it's working:
```bash
pm2 logs app | grep "Using cookies"
# Should see: [YouTube Download] Using cookies from browser: chrome
```

### Error: "S3 upload failed: Access Denied"
**Fix:** 
1. Check AWS credentials in `.env`
2. Verify IAM permissions for S3
3. Check bucket name matches

### Download stuck at "pending"
**Fix:**
1. Check server logs: `pm2 logs app`
2. Restart server: `pm2 restart app`
3. Check queue: `GET /v1/youtube-download/queue`

### Video quality is low
**Fix:** Current settings download up to 2160p (4K). If video doesn't have 4K, best available quality is used.

## Performance

- **Concurrent downloads**: 2 videos at a time (configurable)
- **Download speed**: Depends on video size and server bandwidth
  - 1080p (50MB): ~30 seconds
  - 4K (200MB): ~2 minutes
- **Queue processing**: Automatic, runs in background
- **Server impact**: Low (uses child process)

## Production Deployment

### 1. Update .env on server
```bash
nano /path/to/.env
# Add AWS_S3_BUCKET=klass-vr-videos
```

### 2. Install dependencies
```bash
sudo apt install yt-dlp ffmpeg -y
```

### 3. Create temp directory
```bash
mkdir -p temp-youtube-downloads
```

### 4. Deploy code
```bash
git pull origin main
npm install
```

### 5. Restart server
```bash
pm2 restart app
pm2 logs app
```

### 6. Test
```bash
curl -X POST http://localhost:3000/v1/content \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"xxx","youTubeUrl":"https://youtu.be/nV_hd6bLXmw"}'
```

## Future Enhancements (Optional)

- [ ] Add Redis for persistent job queue
- [ ] Implement retry logic for failed downloads
- [ ] Add webhook notifications when download completes
- [ ] Support for video trimming (start/end times)
- [ ] Implement video transcoding (compress for bandwidth)
- [ ] Add CDN (CloudFront) for faster delivery

## Support

For issues or questions:
1. Check server logs: `pm2 logs app`
2. Verify prerequisites are installed
3. Check AWS credentials and S3 bucket
4. Review this documentation

---

**✅ System Ready!** Videos will now be automatically downloaded and stored in S3 when you create content with a YouTube URL.
