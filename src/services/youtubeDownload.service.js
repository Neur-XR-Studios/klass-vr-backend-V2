const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { uploadToS3, deleteLocalFile } = require('./s3.service');
const Content = require('../models/content.model');
const config = require('../config/config');

const execFilePromise = promisify(execFile);

// Temp downloads directory
const DOWNLOADS_DIR = path.resolve(process.cwd(), 'temp-youtube-downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
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

  console.log('[YouTube Download] Starting download for:', youtubeUrl);
  console.log('[YouTube Download] Video ID:', videoId);

  const outputTemplate = path.join(DOWNLOADS_DIR, `${contentId}_${videoId}.mp4`);
  
  // yt-dlp arguments for best quality with merging
  // Prioritize 4K (2160p) -> 1440p -> 1080p -> best available
  // Removes mp4/m4a restriction to allow VP9/WebM which YouTube uses for 4K
  const args = [
    '--format', 'bestvideo[height<=2160]+bestaudio/bestvideo[height<=1440]+bestaudio/bestvideo+bestaudio/best',
    '--merge-output-format', 'mp4',
    '--output', outputTemplate,
    '--no-playlist',
    '--no-warnings',
    '--progress',
    '--verbose', // Show format selection details
  ];

  // Add cookie support to avoid bot detection
  const youtubeCookie = process.env.YOUTUBE_COOKIE || config.youtube?.cookie;
  if (youtubeCookie) {
    if (youtubeCookie === 'chrome' || youtubeCookie === 'firefox' || youtubeCookie === 'edge' || youtubeCookie === 'safari') {
      // Use browser cookies
      args.push('--cookies-from-browser', youtubeCookie);
      console.log('[YouTube Download] Using cookies from browser:', youtubeCookie);
    } else if (fs.existsSync(youtubeCookie)) {
      // Use cookie file
      args.push('--cookies', youtubeCookie);
      console.log('[YouTube Download] Using cookie file:', youtubeCookie);
    }
  }

  args.push(youtubeUrl);

  // Add start/end time if specified
  if (options.startTime) {
    args.push('--download-sections', `*${options.startTime}-${options.endTime || 'inf'}`);
  }

  console.log('[YouTube Download] Command: yt-dlp', args.join(' '));

  try {
    // Execute yt-dlp
    const { stdout, stderr } = await execFilePromise('yt-dlp', args, {
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      timeout: 600000, // 10 minutes timeout
    });

    if (stderr && stderr.trim()) {
      console.warn('[YouTube Download] Warnings:', stderr.trim());
    }

    console.log('[YouTube Download] ✓ Download complete:', outputTemplate);

    // Check if file exists
    if (!fs.existsSync(outputTemplate)) {
      throw new Error('Downloaded file not found');
    }

    // Get file size
    const stats = fs.statSync(outputTemplate);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log('[YouTube Download] File size:', fileSizeMB, 'MB');

    // Update status
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'downloaded',
      youTubeDownloadProgress: 100,
    });

    return outputTemplate;
  } catch (error) {
    console.error('[YouTube Download] Error:', error.message);
    
    // Update status to failed
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'failed',
      youTubeDownloadError: error.message,
    });

    throw error;
  }
}

/**
 * Complete YouTube video processing workflow
 * Downloads video, uploads to S3, updates content, cleans up
 * @param {string} contentId - Content document ID
 */
async function processYouTubeVideo(contentId) {
  let localFilePath = null;

  try {
    console.log('[YouTube Processor] Starting processing for content:', contentId);

    // Get content document
    const content = await Content.findById(contentId);
    if (!content || !content.youTubeUrl) {
      throw new Error('Content not found or no YouTube URL');
    }

    // Parse start/end times if provided
    const options = {};
    if (content.youTubeStartTimer) {
      options.startTime = content.youTubeStartTimer;
      options.endTime = content.youTubeEndTimer;
    }

    // Step 1: Download video
    localFilePath = await downloadYouTubeVideo(content.youTubeUrl, contentId, options);

    // Step 2: Upload to S3
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'uploading',
    });

    const videoId = extractVideoId(content.youTubeUrl);
    const s3Key = `youtube-videos/${contentId}/${videoId}.mp4`;
    
    const s3Url = await uploadToS3(localFilePath, s3Key, 'video/mp4');

    // Step 3: Update content with S3 URL
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'completed',
      youTubeDownloadedUrl: s3Url,
      youTubeDownloadProgress: 100,
      youTubeDownloadError: null,
    });

    console.log('[YouTube Processor] ✓ Processing complete! S3 URL:', s3Url);

    // Step 4: Clean up local file
    await deleteLocalFile(localFilePath);

    return s3Url;
  } catch (error) {
    console.error('[YouTube Processor] Fatal error:', error.message);

    // Update status to failed
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
