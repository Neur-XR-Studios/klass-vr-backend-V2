const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createDevice = Joi.object({
  deviceID: Joi.string().required(),
  schoolID: Joi.string().required(),
});

const deleteDeviceById = Joi.object({
  deviceId: Joi.string().required(),
});

const getDeviceById = Joi.object({
  params: Joi.object().keys({
    deviceId: Joi.string().custom(objectId),
  }),
});

const updateDeviceById = Joi.object({
  params: Joi.object().keys({
    deviceId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    isBlocked: Joi.boolean(),
    isActive: Joi.boolean(),
  }),
});

module.exports = {
  createDevice,
  deleteDeviceById,
  getDeviceById,
  updateDeviceById,
};
