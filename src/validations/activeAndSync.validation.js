const Joi = require('joi');

const createActiveAndSyncTableSchema = Joi.object({
  schoolId: Joi.string().required(),
  deviceId: Joi.string().required(),
  isActive: Joi.boolean().optional(),
  isSynced: Joi.boolean().optional(),
  deviceStarted: Joi.date().optional(),
  lastActivity: Joi.date().optional(),
});

const updateActiveAndSyncTableSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  isSynced: Joi.boolean().optional(),
  isCompleted: Joi.boolean().optional(),
  deviceStarted: Joi.date().optional(),
  lastActivity: Joi.date().optional(),
});

module.exports = {
  createActiveAndSyncTableSchema,
  updateActiveAndSyncTableSchema,
};
