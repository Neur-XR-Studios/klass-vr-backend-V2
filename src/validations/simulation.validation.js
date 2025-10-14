const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createSimulation = {
  body: Joi.object().keys({
    simulationURL: Joi.string().required(),
    thumbnailURL: Joi.string(),
    title: Joi.string().required(),
    description: Joi.string(),
    displayTime: Joi.string(),
    subject: Joi.string(),
  }),
};

const getSimulations = {
  query: Joi.object().keys({
    title: Joi.string(),
    subject: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getSimulation = {
  params: Joi.object().keys({
    simulationId: Joi.string().custom(objectId),
  }),
};

const updateSimulation = {
  params: Joi.object().keys({
    simulationId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      simulationURL: Joi.string(),
      thumbnailURL: Joi.string(),
      title: Joi.string(),
      description: Joi.string(),
      displayTime: Joi.string(),
      subject: Joi.string(),
    })
    .min(1),
};

const deleteSimulation = {
  params: Joi.object().keys({
    simulationId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createSimulation,
  getSimulations,
  getSimulation,
  updateSimulation,
  deleteSimulation,
};
