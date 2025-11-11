const { execFile, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { uploadToS3, deleteLocalFile } = require('./s3.service');
const { Content, YouTubeVideo } = require('../models');
const config = require('../config/config');

const execFilePromise = promisify(execFile);
const execPromise = promisify(exec);

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

  // Sanitize URL in case of accidental duplication or extraneous text
  const urlMatch = (youtubeUrl || '').match(/https?:\/\/[^\s]+/);
  const finalUrl = urlMatch ? urlMatch[0] : youtubeUrl;

  console.log('[YouTube Download] Starting download for:', finalUrl);
  console.log('[YouTube Download] Video ID:', videoId);

  const outputTemplate = path.join(DOWNLOADS_DIR, `${contentId}_${videoId}.mp4`);
  try {
    console.log('[YouTube Download] Checking yt-dlp installation...');
    try {
      await execPromise('yt-dlp --version');
    } catch (e) {
      throw new Error('yt-dlp is not installed');
    }

    // Cookie support
    let cookieArg = '';
    const youtubeCookie = process.env.YOUTUBE_COOKIE || config.youtube?.cookie;
    if (youtubeCookie) {
      if (youtubeCookie === 'chrome' || youtubeCookie === 'firefox' || youtubeCookie === 'edge' || youtubeCookie === 'safari') {
        cookieArg = ` --cookies-from-browser ${youtubeCookie}`;
        console.log('[YouTube Download] Using cookies from browser:', youtubeCookie);
      } else if (fs.existsSync(youtubeCookie)) {
        cookieArg = ` --cookies "${youtubeCookie}"`;
        console.log('[YouTube Download] Using cookie file:', youtubeCookie);
      } else {
        console.log('[YouTube Download] Cookie path not found:', youtubeCookie);
      }
    }

    console.log('[YouTube Download] Fetching video info...');
    try {
      const { stdout: infoJson } = await execPromise(`yt-dlp${cookieArg} --dump-json "${finalUrl}"`);
      const info = JSON.parse(infoJson);
      if (info && info.title) {
        console.log('[YouTube Download] Title:', info.title);
      }
    } catch (_) {}

    try {
      const { stdout: formats } = await execPromise(`yt-dlp${cookieArg} -F "${finalUrl}"`);
      if (formats) {
        console.log(formats);
      }
    } catch (_) {}

    const sectionArg = options.startTime ? ` --download-sections "*${options.startTime}-${options.endTime || 'inf'}"` : '';

    const downloadCmd = [
      'yt-dlp',
      '-f "bestvideo[height<=2160]+bestaudio/best[height<=2160]"',
      '--merge-output-format mp4',
      `--output "${outputTemplate}"`,
      '--no-playlist',
      '--progress',
      '--newline',
      sectionArg,
      cookieArg,
      `"${finalUrl}"`
    ].join(' ');

    console.log('[YouTube Download] Running command:', downloadCmd);

    await new Promise((resolve, reject) => {
      const child = exec(downloadCmd, { maxBuffer: 1024 * 1024 * 100 });
      child.stdout.on('data', (data) => process.stdout.write(data));
      child.stderr.on('data', (data) => process.stderr.write(data));
      child.on('close', (code) => {
        if (code === 0) return resolve();
        reject(new Error(`yt-dlp exited with code ${code}`));
      });
      child.on('error', reject);
    });

    if (!fs.existsSync(outputTemplate)) {
      throw new Error('Downloaded file not found');
    }

    const stats = fs.statSync(outputTemplate);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log('[YouTube Download] File size:', fileSizeMB, 'MB');

    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'downloaded',
      youTubeDownloadProgress: 100,
    });

    return outputTemplate;
  } catch (error) {
    console.error('[YouTube Download] Error:', error.message);
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

    // Step 2: Create or get YouTubeVideo entry
    if (!youtubeVideo) {
      youtubeVideo = await YouTubeVideo.findOrCreateByUrl(youtubeUrl);
    }
    
    youtubeVideo.downloadStatus = 'downloading';
    youtubeVideo.downloadStartedAt = new Date();
    await youtubeVideo.save();

    // Step 3: Get metadata
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

    // Step 4: Download video (1080p)
    localFilePath = await downloadYouTubeVideo(youtubeUrl, contentId, options);

    // Step 5: Extract format details from downloaded file
    const stats = fs.statSync(localFilePath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    const downloadedFormat = {
      resolution: '1920x1080',
      height: 1080,
      width: 1920,
      filesize: stats.size,
      filesizeMB: parseFloat(fileSizeMB),
      ext: 'mp4',
    };

    // Step 6: Upload to S3
    youtubeVideo.downloadStatus = 'uploading';
    await youtubeVideo.save();
    
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'uploading',
    });

    const s3Key = `youtube-videos/${videoId}/${videoId}.mp4`;
    const s3Url = await uploadToS3(localFilePath, s3Key, 'video/mp4');

    // Step 7: Update YouTubeVideo with completion details
    await youtubeVideo.markCompleted(s3Url, s3Key, downloadedFormat);
    await youtubeVideo.incrementUsage();
    
    console.log('[YouTube Processor] ✓ YouTubeVideo updated with S3 URL');

    // Step 8: Update Content with S3 URL and reference
    await Content.findByIdAndUpdate(contentId, {
      youTubeDownloadStatus: 'completed',
      youTubeDownloadedUrl: s3Url,
      youTubeDownloadProgress: 100,
      youTubeDownloadError: null,
      youtubeVideoRef: youtubeVideo._id,
    });

    console.log('[YouTube Processor] ✓ Processing complete! S3 URL:', s3Url);
    console.log('[YouTube Processor] ✓ YouTubeVideo ID:', youtubeVideo._id, '| Number:', youtubeVideo.videoNumber);

    // Step 9: Clean up local file
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
