const Joi = require('joi');
const { objectId } = require('./custom.validation');

const updateRolePermissions = {
  params: Joi.object().keys({
    roleId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    permissions: Joi.array().items(Joi.string()).required(),
  }),
};

module.exports = {
  updateRolePermissions,
};
