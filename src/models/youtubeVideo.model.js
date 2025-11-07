const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const youtubeVideoSchema = mongoose.Schema(
  {
    // Auto-increment ID for counting
    videoNumber: {
      type: Number,
      unique: true,
    },
    
    // YouTube video identification
    youTubeUrl: {
      type: String,
      required: true,
      unique: true, // Ensure one entry per unique URL
      trim: true,
    },
    
    videoId: {
      type: String,
      required: true,
      unique: true, // YouTube video ID (extracted from URL)
      index: true,
    },
    
    // Download status
    downloadStatus: {
      type: String,
      enum: ['pending', 'downloading', 'uploading', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    
    // S3 storage
    s3Url: {
      type: String,
      default: null,
    },
    
    s3Key: {
      type: String,
      default: null,
    },
    
    // Download progress and error
    downloadProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    downloadError: {
      type: String,
      default: null,
    },
    
    // Video metadata
    metadata: {
      title: { type: String },
      description: { type: String },
      duration: { type: Number }, // Duration in seconds
      uploadDate: { type: String },
      uploader: { type: String },
      channelId: { type: String },
      channelUrl: { type: String },
      viewCount: { type: Number },
      likeCount: { type: Number },
      thumbnail: { type: String },
      categories: [{ type: String }],
      tags: [{ type: String }],
    },
    
    // Downloaded video details
    downloadedFormat: {
      resolution: { type: String }, // e.g., "3840x2160", "1920x1080"
      height: { type: Number }, // e.g., 2160, 1080
      width: { type: Number }, // e.g., 3840, 1920
      fps: { type: Number },
      vcodec: { type: String }, // e.g., "vp9", "avc1", "av01"
      acodec: { type: String }, // e.g., "opus", "mp4a"
      filesize: { type: Number }, // File size in bytes
      filesizeMB: { type: Number }, // File size in MB
      ext: { type: String, default: 'mp4' },
      format: { type: String }, // Full format string from yt-dlp
      is4K: { type: Boolean, default: false }, // true if 2160p
    },
    
    // Download timestamps
    downloadStartedAt: {
      type: Date,
      default: null,
    },
    
    downloadCompletedAt: {
      type: Date,
      default: null,
    },
    
    // Reference count (how many Content entries use this video)
    usageCount: {
      type: Number,
      default: 0,
    },
    
    // Last accessed
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Auto-increment plugin for videoNumber
youtubeVideoSchema.plugin(AutoIncrement, {
  inc_field: 'videoNumber',
  start_seq: 1,
});

// Index for efficient queries (videoId and youTubeUrl already indexed via field definitions)
youtubeVideoSchema.index({ downloadStatus: 1, createdAt: -1 });

// Static method to find or create by URL
youtubeVideoSchema.statics.findOrCreateByUrl = async function(youTubeUrl) {
  // Extract video ID from URL
  const videoIdMatch = youTubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  if (!videoIdMatch) {
    throw new Error('Invalid YouTube URL');
  }
  const videoId = videoIdMatch[1];
  
  // Find existing video
  let video = await this.findOne({ videoId });
  
  if (!video) {
    // Create new video entry
    video = await this.create({
      youTubeUrl,
      videoId,
      downloadStatus: 'pending',
    });
  }
  
  return video;
};

// Method to update usage count
youtubeVideoSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.lastAccessedAt = new Date();
  await this.save();
};

// Method to update metadata
youtubeVideoSchema.methods.updateMetadata = async function(metadata) {
  this.metadata = {
    ...this.metadata,
    ...metadata,
  };
  await this.save();
};

// Method to mark as completed
youtubeVideoSchema.methods.markCompleted = async function(s3Url, s3Key, downloadedFormat) {
  this.downloadStatus = 'completed';
  this.s3Url = s3Url;
  this.s3Key = s3Key;
  this.downloadedFormat = downloadedFormat;
  this.downloadProgress = 100;
  this.downloadCompletedAt = new Date();
  this.downloadError = null;
  await this.save();
};

// Method to mark as failed
youtubeVideoSchema.methods.markFailed = async function(error) {
  this.downloadStatus = 'failed';
  this.downloadError = error;
  this.downloadProgress = 0;
  await this.save();
};

/**
 * @typedef YouTubeVideo
 */
const YouTubeVideo = mongoose.model('YouTubeVideo', youtubeVideoSchema);

module.exports = YouTubeVideo;
