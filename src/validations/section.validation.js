const Joi = require("joi");

const createSection = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    gradeId: Joi.string().required(),
  }),
};

const getSections = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getSection = {
  params: Joi.object().keys({
    sectionId: Joi.string().required(),
  }),
};

const getSectionByGrade = {
  params: Joi.object().keys({
    gradeId: Joi.string().required(),
  }),
};

const updateSection = {
  params: Joi.object().keys({
    sectionId: Joi.required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      gradeId: Joi.string(),
    })
    .min(1),
};

const deleteSection = {
  params: Joi.object().keys({
    sectionId: Joi.string().required(),
  }),
};

module.exports = {
  createSection,
  getSections,
  getSection,
  updateSection,
  deleteSection,
  getSectionByGrade,
};
