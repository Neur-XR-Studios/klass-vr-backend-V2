const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createModel = {
  body: Joi.object().keys({
    modelName: Joi.string().required(),
    description: Joi.string().allow(''),
    tags: Joi.any(),
    createdBy: Joi.string().custom(objectId),
  }),
};

const queryModels = {
  query: Joi.object().keys({
    modelName: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getModel = {
  params: Joi.object().keys({
    modelId: Joi.string().custom(objectId).required(),
  }),
};

const updateModel = {
  params: Joi.object().keys({
    modelId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      modelName: Joi.string(),
      description: Joi.string().allow(''),
      tags: Joi.array().items(Joi.string()),
    })
    .min(1), // Ensure that at least one field is being updated
};

const deleteModel = {
  params: Joi.object().keys({
    modelId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createModel,
  queryModels,
  getModel,
  updateModel,
  deleteModel,
};
