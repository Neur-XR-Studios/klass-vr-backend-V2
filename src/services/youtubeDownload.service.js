const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { uploadToS3, deleteLocalFile } = require('./s3.service');
const { Content, YouTubeVideo } = require('../models');
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
  
  // yt-dlp arguments for STRICT 4K download
  // Will FAIL if 4K is not available
  const args = [
    '--format', 'bestvideo[height>=2160]+bestaudio/bestvideo[height=2160]+bestaudio',  // STRICT 4K only
    '--merge-output-format', 'mp4',
    '--output', outputTemplate,
    '--no-playlist',
    '--no-warnings',
    '--progress',
    '--print-json',  // Get JSON metadata
    '--no-simulate',  // Actually download
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

    if (stdout && stdout.trim()) {
      console.log('[YouTube Download] Output:', stdout.trim());
    }
    
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
 * Get video metadata using yt-dlp
 */
async function getVideoMetadata(youtubeUrl) {
  try {
    const args = ['--dump-json', '--no-playlist', youtubeUrl];
    
    const youtubeCookie = process.env.YOUTUBE_COOKIE || config.youtube?.cookie;
    if (youtubeCookie) {
      if (youtubeCookie === 'chrome' || youtubeCookie === 'firefox' || youtubeCookie === 'edge' || youtubeCookie === 'safari') {
        args.push('--cookies-from-browser', youtubeCookie);
      } else if (fs.existsSync(youtubeCookie)) {
        args.push('--cookies', youtubeCookie);
      }
    }
    
    const { stdout } = await execFilePromise('yt-dlp', args, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });
    
    const metadata = JSON.parse(stdout);
    return metadata;
  } catch (error) {
    console.error('[YouTube Metadata] Error:', error.message);
    return null;
  }
}

/**
 * Check if video has 4K available
 */
async function check4KAvailable(youtubeUrl) {
  try {
    const metadata = await getVideoMetadata(youtubeUrl);
    if (!metadata || !metadata.formats) {
      return false;
    }
    
    // Check if any format has height >= 2160
    const has4K = metadata.formats.some(f => f.height && f.height >= 2160);
    
    if (!has4K) {
      console.log('[YouTube 4K Check] ❌ No 4K formats available for:', youtubeUrl);
      console.log('[YouTube 4K Check] Max resolution:', Math.max(...metadata.formats.filter(f => f.height).map(f => f.height)));
    } else {
      console.log('[YouTube 4K Check] ✓ 4K format available');
    }
    
    return has4K;
  } catch (error) {
    console.error('[YouTube 4K Check] Error:', error.message);
    return false;
  }
}

/**
 * Complete YouTube video processing workflow
 * Downloads video, uploads to S3, updates YouTubeVideo model and Content
 * @param {string} contentId - Content document ID
 */
async function processYouTubeVideo(contentId) {
  let localFilePath = null;
  let youtubeVideo = null;

  try {
    console.log('[YouTube Processor] Starting processing for content:', contentId);

    // Get content document
    const content = await Content.findById(contentId);
    if (!content || !content.youTubeUrl) {
      throw new Error('Content not found or no YouTube URL');
    }

    const youtubeUrl = content.youTubeUrl;
    const videoId = extractVideoId(youtubeUrl);

    // Step 1: Check if video already exists in YouTubeVideo collection
    youtubeVideo = await YouTubeVideo.findOne({ videoId });
    
    if (youtubeVideo && youtubeVideo.downloadStatus === 'completed' && youtubeVideo.s3Url) {
      console.log('[YouTube Processor] ✓ Video already downloaded! Using existing:', youtubeVideo.s3Url);
      
      // Increment usage count
      await youtubeVideo.incrementUsage();
      
      // Update Content with existing S3 URL
      await Content.findByIdAndUpdate(contentId, {
        youTubeDownloadStatus: 'completed',
        youTubeDownloadedUrl: youtubeVideo.s3Url,
        youTubeDownloadProgress: 100,
        youTubeDownloadError: null,
        youtubeVideoRef: youtubeVideo._id,
      });
      
      return youtubeVideo.s3Url;
    }

    // Step 2: Check if video has 4K (STRICT enforcement)
    console.log('[YouTube Processor] Checking for 4K availability...');
    const has4K = await check4KAvailable(youtubeUrl);
    
    if (!has4K) {
      const error = 'Video does not have 4K quality available. Only 4K videos are allowed.';
      console.error('[YouTube Processor] ❌', error);
      
      // Update Content status
      await Content.findByIdAndUpdate(contentId, {
        youTubeDownloadStatus: 'failed',
        youTubeDownloadError: error,
      });
      
      throw new Error(error);
    }

    // Step 3: Create or get YouTubeVideo entry
    if (!youtubeVideo) {
      youtubeVideo = await YouTubeVideo.findOrCreateByUrl(youtubeUrl);
    }
    
    youtubeVideo.downloadStatus = 'downloading';
    youtubeVideo.downloadStartedAt = new Date();
    await youtubeVideo.save();

    // Step 4: Get metadata
    console.log('[YouTube Processor] Fetching metadata...');
    const metadata = await getVideoMetadata(youtubeUrl);
    if (metadata) {
      await youtubeVideo.updateMetadata({
        title: metadata.title,
        description: metadata.description,
        duration: metadata.duration,
        uploadDate: metadata.upload_date,
        uploader: metadata.uploader,
        channelId: metadata.channel_id,
        channelUrl: metadata.channel_url,
        viewCount: metadata.view_count,
        likeCount: metadata.like_count,
        thumbnail: metadata.thumbnail,
        categories: metadata.categories,
        tags: metadata.tags,
      });
      console.log('[YouTube Processor] ✓ Metadata saved');
    }

    // Parse start/end times if provided
    const options = {};
    if (content.youTubeStartTimer) {
      options.startTime = content.youTubeStartTimer;
      options.endTime = content.youTubeEndTimer;
    }

    // Step 5: Download video (STRICT 4K)
    localFilePath = await downloadYouTubeVideo(youtubeUrl, contentId, options);

    // Step 6: Extract format details from downloaded file
    const stats = fs.statSync(localFilePath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    // Parse format from yt-dlp output (assuming 4K since we enforced it)
    const downloadedFormat = {
      resolution: '3840x2160',
      height: 2160,
      width: 3840,
      filesize: stats.size,
      filesizeMB: parseFloat(fileSizeMB),
      ext: 'mp4',
      is4K: true,
    };

    // Step 7: Upload to S3
    youtubeVideo.downloadStatus = 'uploading';
    await youtubeVideo.save();
    
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'uploading',
    });

    const s3Key = `youtube-videos/${videoId}/${videoId}.mp4`;
    const s3Url = await uploadToS3(localFilePath, s3Key, 'video/mp4');

    // Step 8: Update YouTubeVideo with completion details
    await youtubeVideo.markCompleted(s3Url, s3Key, downloadedFormat);
    await youtubeVideo.incrementUsage();
    
    console.log('[YouTube Processor] ✓ YouTubeVideo updated with S3 URL and 4K metadata');

    // Step 9: Update Content with S3 URL and reference
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'completed',
      youTubeDownloadedUrl: s3Url,
      youTubeDownloadProgress: 100,
      youTubeDownloadError: null,
      youtubeVideoRef: youtubeVideo._id,
    });

    console.log('[YouTube Processor] ✓ Processing complete! S3 URL:', s3Url);
    console.log('[YouTube Processor] ✓ YouTubeVideo ID:', youtubeVideo._id, '| Number:', youtubeVideo.videoNumber);

    // Step 10: Clean up local file
    await deleteLocalFile(localFilePath);

    return s3Url;
  } catch (error) {
    console.error('[YouTube Processor] Fatal error:', error.message);

    // Update YouTubeVideo status to failed
    if (youtubeVideo) {
      await youtubeVideo.markFailed(error.message);
    }

    // Update Content status to failed
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
