require("dotenv");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
const tmp = require("tmp");
const path = require("path");
const httpStatus = require("http-status");
const { Video, User } = require("../models");
const ApiError = require("../utils/ApiError");
const { uploadToS3, deleteFileFromS3 } = require("../utils/multer");
const { v4: uuidv4 } = require("uuid");

/**
 * Create a video
 * @param {Object} videoBody
 * @returns {Promise<Video>}
 */

const createVideo = async (videoBody) => {
  const startTime = Date.now();
  try {
    const { title, description, tags, typeOfVideo } = videoBody.body;
    const videoFile =
      videoBody.files &&
      videoBody.files.find((file) => file.fieldname === "videoFile");

    // Handle file updates and get the updated file URL
    const updatedFiles = await uploadToS3(
      {
        ...videoFile,
        format: path.extname(videoFile.originalname),
      },
      "videos"
    );

    console.log("executionTime for uploading in aws :", Date.now() - startTime);

    // Use a temporary file for both metadata extraction and thumbnail generation
    return new Promise((resolve, reject) => {
      tmp.file(
        { postfix: ".mp4" },
        async (err, tempFilePath, fd, cleanupCallback) => {
          if (err) return reject(err);

          fs.writeFileSync(tempFilePath, videoFile.buffer);

          try {
            // Extract video metadata
            const metaData = await new Promise((resolve, reject) => {
              ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata);
              });
            });
            console.log(
              "executionTime for metadata extraction :",
              Date.now() - startTime
            );

            // Generate a thumbnail
            const thumbnailPath = path.join(
              __dirname,
              "..",
              "temp",
              `thumbnail_${uuidv4()}.jpg`
            );
            await new Promise((resolve, reject) => {
              ffmpeg(tempFilePath)
                .on("end", function () {
                  resolve();
                })
                .on("error", function (err) {
                  reject(err);
                })
                .screenshots({
                  count: 1,
                  folder: path.dirname(thumbnailPath),
                  filename: path.basename(thumbnailPath),
                  timestamps: ["50%"],
                });
            });

            console.log(
              "executionTime for thumbnail extraction :",
              Date.now() - startTime
            );

            const thumbnailBuffer = fs.readFileSync(thumbnailPath);

            // Upload the thumbnail to S3
            const thumbnailUrl = await uploadToS3(
              {
                buffer: thumbnailBuffer,
                format: path.extname(thumbnailPath),
                originalname: path.basename(thumbnailPath),
              },
              "thumbnails"
            );

            fs.unlinkSync(thumbnailPath); // Delete the temporary thumbnail file

            const video = new Video({
              videoURL: updatedFiles,
              resolution: `${metaData.streams[0].width}x${metaData.streams[0].height}`,
              frameRate: metaData.streams[0].r_frame_rate,
              bitrate: metaData.streams[0].bit_rate,
              codec: metaData.streams[0].codec_name,
              aspectRatio: metaData.streams[0].display_aspect_ratio,
              audioInformation: `${metaData.streams[1].codec_long_name}, ${metaData.streams[1].sample_rate}Hz, ${metaData.streams[1].channels} channels`,
              fileSize: videoFile.size,
              createdBy: videoBody.user._id,
              title,
              description,
              tags,
              duration: metaData.format.duration,
              format: videoFile.format,
              thumbnail: thumbnailUrl,
              typeOfVideo,
              userRole: videoBody.user.role,
            });

            console.log("Total executionTime:", Date.now() - startTime);

            resolve(video.save()); // Resolve the promise with the saved video
          } catch (error) {
            reject(error);
          } finally {
            cleanupCallback(); // Ensure the temporary file is deleted
          }
        }
      );
    });
  } catch (error) {
    console.error("Error creating video:", error);
    throw new Error("Video creation failed");
  }
};

/**
 * Update an existing video record's metadata.
 *
 * @param {String} videoId - The ID of the video to update.
 * @param {Object} updateData - The new video data, including title, description, and tags array.
 * @returns {Promise<Object>} - The updated video document.
 */
async function updateVideoById(videoId, updateData) {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  // Update metadata fields like title, description, and tags
  if (updateData.title) video.title = updateData.title;
  if (updateData.typeOfVideo) video.typeOfVideo = updateData.typeOfVideo;
  if (updateData.description) video.description = updateData.description;
  if (updateData.tags && Array.isArray(updateData.tags))
    video.tags = updateData.tags;

  await video.save();

  return video;
}

const queryVideos = async (filter, options) => {
  filter.userRole = "repoManager";
  const videos = await Video.paginate(filter, options);
  return videos;
};

const getVideoById = async (videoId) => {
  return Video.findById(videoId);
};

const deleteVideoById = async (videoId) => {
  const videoData = await getVideoById(videoId);
  console.log(videoData.videoURL);
  console.log(videoData.thumbnail);
  await deleteFileFromS3("videos", videoData.videoURL);
  await deleteFileFromS3("thumbnails", videoData.thumbnail);
  const video = await Video.findByIdAndDelete(videoId);
  if (!video) {
    throw new ApiError(httpStatus.NOT_FOUND, "Video not found");
  }
  // await video.remove();
  return video;
};

/**
 * Get all unique tags
 * @returns {Promise<Array>}
 */
const getAllTags = async (schoolId) => {
  const users = await User.find({ role: "repoManager" }).select("_id");
  const userIds = users.map((user) => user._id);

  const videos = await Video.find({ createdBy: { $in: userIds } }).select(
    "tags -_id"
  );
  const tags = videos.flatMap((video) => video.tags);
  return Array.from(new Set(tags));
};

/**
 * Get tags based on school ID and user role
 * @param {ObjectId} schoolId
 * @returns {Promise<Array>}
 */
const getTags = async (schoolId) => {
  let userIds = [];

  if (schoolId) {
    const users = await User.find({ schoolId }).select("_id");
    userIds = users.map((user) => user._id);
  } else {
    const users = await User.find({ userRole: "repoManager" }).select("_id");
    userIds = users.map((user) => user._id);
  }

  const videos = await Video.find({ createdBy: { $in: userIds } }).select(
    "tags -_id"
  );
  const tags = videos.flatMap((video) => video.tags);

  return Array.from(new Set(tags));
};

module.exports = {
  createVideo,
  queryVideos,
  getVideoById,
  updateVideoById,
  deleteVideoById,
  getAllTags,
  getTags,
};
