const Joi = require("joi");

const createSubscriptionSchema = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    isActive: Joi.boolean().default(true),
    description: Joi.string(),
  }),
};

const updateSubscriptionSchema = {
  body: Joi.object().keys({
    name: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    isActive: Joi.boolean(),
    description: Joi.string(),
  }),
  params: Joi.object().keys({
    subscriptionId: Joi.string().required(),
  }),
};

const getSubscriptionByIdSchema = {
  params: Joi.object().keys({
    subscriptionId: Joi.string().required(),
  }),
};

const deleteSubscriptionSchema = {
  params: Joi.object().keys({
    subscriptionId: Joi.string().required(),
  }),
};

module.exports = {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  getSubscriptionByIdSchema,
  deleteSubscriptionSchema,
};
