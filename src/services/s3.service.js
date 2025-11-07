const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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

module.exports = {
  uploadToS3,
  deleteLocalFile,
  S3_BUCKET,
};
