const Joi = require('joi');
const { objectId } = require('./custom.validation');

const isValidIsoDate = (value) => {
  if (value === '' || new Date(value).toISOString() === value) {
    return value;
  } else {
    throw new Joi.ValidationError('Invalid ISO date format', { value }, 'sessionStartedTime');
  }
};
const createSession = {
  body: Joi.object().keys({
    name: Joi.string(),
    sessionTimeAndDate: Joi.date().iso().required(),
    sessionStartedTime: Joi.string().custom(isValidIsoDate).allow(''),
    sessionEndedTime: Joi.string().custom(isValidIsoDate).allow(''),
    grade: Joi.string(),
    sessionStatus: Joi.string().valid('pending', 'in progress', 'completed'),
    subject: Joi.string(),
    feedback: Joi.alternatives().try(Joi.string().allow('')).optional(),
    sessionDuration: Joi.number().integer(),
    sectionOrClass: Joi.string(),
    isDraft: Joi.boolean(),
    stepperNo: Joi.number(),
  }),
};

const getSessions = {
  query: Joi.object().keys({
    name: Joi.string(),
    sessionTimeAndDate: Joi.date().iso(),
    sessionStartedTime: Joi.date().iso(),
    sessionEndedTime: Joi.date().iso(),
    grade: Joi.string(),
    sessionStatus: Joi.string().valid('pending', 'in progress', 'completed'),
    teacherId: Joi.string().custom(objectId),
    subject: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    stepperNo: Joi.number(),
  }),
};

const getSession = {
  params: Joi.object().keys({
    sessionId: Joi.string().custom(objectId),
  }),
};

const updateSession = {
  params: Joi.object().keys({
    sessionId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      sessionTimeAndDate: Joi.date().iso(),
      sessionStartedTime: Joi.date().iso(),
      sessionEndedTime: Joi.date().iso(),
      grade: Joi.string(),
      sessionStatus: Joi.string().valid('pending', 'in progress', 'completed'),
      subject: Joi.string(),
      feedback: Joi.string(),
      sessionDuration: Joi.number().integer(),
      sectionOrClass: Joi.string(),
      isCorrect: Joi.boolean(),
      isDraft: Joi.boolean(),
      stepperNo: Joi.number(),
    })
    .min(1),
};

const deleteSession = {
  params: Joi.object().keys({
    sessionId: Joi.string().custom(objectId),
  }),
};
const deploySessionValidation = {
  params: Joi.object().keys({
    sessionId: Joi.string().custom(objectId),
  }),
};
const filterSessions = {
  body: Joi.object().keys({
    grade: Joi.string().allow('').optional(),
    subject: Joi.string().allow('').optional(),
  }),
};

module.exports = {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
  deploySessionValidation,
  filterSessions,
};
