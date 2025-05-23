const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createGrade = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const getGrades = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getGrade = {
  params: Joi.object().keys({
    gradeId: Joi.string().custom(objectId),
  }),
};

const updateGrade = {
  params: Joi.object().keys({
    gradeId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().required(),
    })
    .min(1),
};

const deleteGrade = {
  params: Joi.object().keys({
    gradeId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createGrade,
  getGrades,
  getGrade,
  updateGrade,
  deleteGrade,
};
