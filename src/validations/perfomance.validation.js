const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createPerfomance = Joi.object({
  studentID: Joi.string().required(),
  experienceConductedID: Joi.string().custom(objectId),
  schoolId: Joi.string().custom(objectId),
  sectionID: Joi.string().custom(objectId),
  gradeID: Joi.string().custom(objectId),
  score: Joi.number().required(),
});

const getPerfomanceById = {
  params: Joi.object({
    schoolId: Joi.string().required(),
  }),
};

const updatePerfomance = {
  params: Joi.object({
    schoolId: Joi.string().required(),
  }),
  body: Joi.object({
    studentID: Joi.string().custom(objectId),
    experienceConductedID: Joi.string().custom(objectId),
    schoolId: Joi.string().custom(objectId),
    sectionID: Joi.string().custom(objectId),
    gradeID: Joi.string().custom(objectId),
    score: Joi.number(),
  }),
};

const deletePerfomance = {
  params: Joi.object({
    schoolId: Joi.string().required(),
  }),
};
const getTeacherDashboardData = {
  params: Joi.object({
    gradeId: Joi.string().custom(objectId),
    sectionId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createPerfomance,
  getPerfomanceById,
  updatePerfomance,
  deletePerfomance,
  getTeacherDashboardData,
};
