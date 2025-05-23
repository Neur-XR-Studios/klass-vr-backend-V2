const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createStudent = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    gradeId: Joi.string().custom(objectId).required(),
    sectionId: Joi.string().custom(objectId).required(),
  }),
};

const getStudents = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getStudent = {
  params: Joi.object().keys({
    studentId: Joi.string().custom(objectId),
  }),
};

const updateStudent = {
  params: Joi.object().keys({
    studentId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      sectionId: Joi.string().custom(objectId),
      gradeId: Joi.string().custom(objectId),
    })
    .min(1),
};

const deleteStudent = {
  params: Joi.object().keys({
    studentId: Joi.string().custom(objectId),
  }),
};

const validateExportStudents = {
  body: Joi.object().keys({
    gradeId: Joi.string().custom(objectId).required(),
    sectionId: Joi.string().custom(objectId).required(),
  }),
};

const importStudents = {
  body: Joi.object().keys({
    gradeId: Joi.string().custom(objectId).required(),
    sectionId: Joi.string().custom(objectId).required(),
  }),
};

const searchStudents = {
  body: Joi.object().keys({
    gradeId: Joi.string().custom(objectId).required(),
    sectionId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  validateExportStudents,
  importStudents,
  searchStudents,
};
