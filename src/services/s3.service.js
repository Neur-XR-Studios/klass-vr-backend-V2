const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

// S3 bucket name - same as video.service.js
const S3_BUCKET = 'klass-vr-file';

/**
 * Upload file to S3
 * @param {string} filePath - Local file path
 * @param {string} s3Key - S3 object key (filename in S3)
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - S3 URL
 */
const uploadToS3 = async (filePath, s3Key, contentType = 'video/mp4') => {
  try {
    console.log('[S3 Upload] Starting upload:', s3Key);
    
    // Read file
    const fileStream = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);
    
    console.log('[S3 Upload] File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    
    // Upload to S3
    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileStream,
      ContentType: contentType,
    };
    
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    
    // Generate S3 URL
    const s3Url = `https://${S3_BUCKET}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;
    
    console.log('[S3 Upload] ✓ Upload complete:', s3Url);
    
    return s3Url;
  } catch (error) {
    console.error('[S3 Upload] Error:', error.message);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

/**
 * Delete file from local filesystem
 * @param {string} filePath
 */
const deleteLocalFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('[S3] Deleted local file:', filePath);
    }
  } catch (error) {
    console.error('[S3] Error deleting local file:', error.message);
  }
};

/**
 * Generate a pre-signed URL for S3 object
 * This allows AVPro Video Player to access the video without public bucket access
 * @param {string} s3Url - Full S3 URL (https://bucket.s3.region.amazonaws.com/key)
 * @param {number} expiresIn - URL expiration time in seconds (default: 6 hours)
 * @returns {Promise<string>} - Pre-signed URL
 */
const getSignedS3Url = async (s3Url, expiresIn = 21600) => {
  try {
    if (!s3Url) return null;
    
    // Extract key from S3 URL
    // Format: https://bucket.s3.region.amazonaws.com/key
    const urlObj = new URL(s3Url);
    const key = decodeURIComponent(urlObj.pathname.substring(1)); // Remove leading '/'
    
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    console.log('[S3] Generated signed URL for:', key);
    
    return signedUrl;
  } catch (error) {
    console.error('[S3] Error generating signed URL:', error.message);
    return s3Url; // Fallback to original URL
  }
};

module.exports = {
  uploadToS3,
  deleteLocalFile,
  getSignedS3Url,
  S3_BUCKET,
};
