const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createVideo = {
  body: Joi.object().keys({
    videoURL: Joi.string(),
    resolution: Joi.string(),
    frameRate: Joi.string(),
    bitrate: Joi.number(),
    codec: Joi.string(),
    aspectRatio: Joi.string(),
    audioInformation: Joi.string(),
    fileSize: Joi.number(),
    createdBy: Joi.string().custom(objectId),
    title: Joi.string(),
    description: Joi.string(),
    tags: Joi.any(),
    duration: Joi.number(),
    format: Joi.string(),
    thumbnail: Joi.string(),
    typeOfVideo: Joi.string(),
  }),
};

const getVideos = {
  query: Joi.object().keys({
    title: Joi.string(),
    createdBy: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getVideo = {
  params: Joi.object().keys({
    videoId: Joi.string().custom(objectId),
  }),
};

const updateVideo = {
  params: Joi.object().keys({
    videoId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string(),
      tags: Joi.array().items(Joi.string()),
      typeOfVideo: Joi.string(),
    })
    .min(1),
};

const deleteVideo = {
  params: Joi.object().keys({
    videoId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createVideo,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo,
};
