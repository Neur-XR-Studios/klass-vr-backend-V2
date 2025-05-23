const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createImage = {
  body: Joi.object().keys({
    imageURL: Joi.string().uri(),
    fileSize: Joi.number(),
    format: Joi.string(),
    createdBy: Joi.string().custom(objectId),
    title: Joi.string(),
    description: Joi.string().allow(""),
    tags: Joi.array().items(Joi.string()),
    userRole: Joi.string(),
  }),
};

const getImages = {
  query: Joi.object().keys({
    title: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    createdBy: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getImage = {
  params: Joi.object().keys({
    imageId: Joi.string().custom(objectId),
  }),
};

const updateImage = {
  params: Joi.object().keys({
    imageId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      imageURL: Joi.string().uri(),
      fileSize: Joi.number(),
      format: Joi.string(),
      title: Joi.string(),
      description: Joi.string().allow(""),
      tags: Joi.array().items(Joi.string()),
      userRole: Joi.string(),
    })
    .min(1),
};

const deleteImage = {
  params: Joi.object().keys({
    imageId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createImage,
  getImages,
  getImage,
  updateImage,
  deleteImage,
};
