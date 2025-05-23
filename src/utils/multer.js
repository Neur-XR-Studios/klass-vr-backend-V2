const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bucketName = 'klass-vr-file';
const awsConfig = require('../config/config');
const aws = require('aws-sdk');
const s3 = new aws.S3(awsConfig.aws);

const storages = multer.memoryStorage();

const upload = multer({
  storage: storages,
  limits: { fileSize: 2000 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

function getFileContentType(ext) {
  switch (ext) {
    case '.fbx':
      return 'model/vnd.fb.exchange';
    case '.glb':
      return 'model/gltf-binary';
    case '.mp4':
      return 'video/mp4';
    case '.jpg':
      return 'image/jpg';
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

const uploadToS3 = async (file, folder) => {
  let uploadId;

  try {
    const key = `${folder}/${uuidv4()}${file.format}`;
    const params = {
      Bucket: bucketName,
      Key: key,
      ContentType: getFileContentType(file.format),
    };

    // Initiate the multipart upload
    uploadId = (await s3.createMultipartUpload(params).promise()).UploadId;

    // Calculate the part size
    const partSize = 5 * 1024 * 1024; // 5 MB part size (adjust as needed)

    // Calculate the number of parts
    const numParts = Math.ceil(file.buffer.length / partSize);

    // Upload each part
    const uploadPromises = [];
    for (let i = 0; i < numParts; i++) {
      const start = i * partSize;
      const end = Math.min((i + 1) * partSize, file.buffer.length);

      const uploadParams = {
        Bucket: bucketName,
        Key: key,
        PartNumber: i + 1,
        UploadId: uploadId,
        Body: file.buffer.slice(start, end),
      };

      const uploadPartPromise = s3.uploadPart(uploadParams).promise();
      uploadPromises.push(uploadPartPromise);
    }

    // Wait for all parts to complete
    const uploadResponses = await Promise.all(uploadPromises);

    // Complete the multipart upload
    const completedParams = {
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: uploadResponses.map((part, index) => ({
          ETag: part.ETag,
          PartNumber: index + 1,
        })),
      },
    };

    const result = await s3.completeMultipartUpload(completedParams).promise();

    if (!result.Location) {
      throw new Error('S3 upload did not return a valid location');
    }

    return result.Location;
  } catch (error) {
    console.error('Error in uploadToS3:', error.message);

    // If an error occurs, abort the multipart upload to clean up resources
    if (uploadId) {
      await s3
        .abortMultipartUpload({
          Bucket: bucketName,
          UploadId: uploadId,
        })
        .promise();
    }

    throw error;
  }
};

function checkFileType(file, cb) {
  const allowedModelTypes = /fbx|glb|gltf/;
  const allowedVideoTypes = /mp4|mov|avi|mkv/;
  const allowedImageTypes = /jpg|gif|png|jpeg/;

  if (allowedModelTypes.test(path.extname(file.originalname).toLowerCase())) {
    file.format = path.extname(file.originalname).toLowerCase();
    return cb(null, true);
  }

  if (allowedVideoTypes.test(path.extname(file.originalname).toLowerCase())) {
    file.format = path.extname(file.originalname).toLowerCase();
    return cb(null, true);
  }

  if (allowedImageTypes.test(path.extname(file.originalname).toLowerCase())) {
    file.format = path.extname(file.originalname).toLowerCase();
    return cb(null, true);
  }
  cb(
    new Error(
      'Invalid file type. Allowed formats: Model (.glb, .gltf), Video (.mp4, .mov, .avi, .mkv), Image (.jpg, .jpeg, .png, .gif)',
    ),
  );
}
function getFileNameFromUrl(url) {
  const parsedUrl = new URL(url);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const pathSegments = pathname.split('/');
  const fileName = pathSegments[pathSegments.length - 1];
  return fileName;
}

const deleteFileFromS3 = async (folder, fileName) => {
  try {
    const extractedFileName = getFileNameFromUrl(fileName);
    console.log('extractedFileName :', extractedFileName);
    const key = `${folder}/${extractedFileName}`;
    await s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
  } catch (error) {
    console.error('Error in deleteFileFromS3:', error);
    throw error;
  }
};

const uploadFiles = upload.any();

module.exports = {
  uploadFiles,
  uploadToS3,
  deleteFileFromS3,
};
