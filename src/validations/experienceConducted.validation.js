const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createExperienceConducted = Joi.object({
  experienceID: Joi.string().custom(objectId),
  teacherID: Joi.string().custom(objectId),
  classStartTime: Joi.date(),
  classEndTime: Joi.date(),
  totalStudentsAttended: Joi.number(),
  schoolID: Joi.string().custom(objectId),
  conductedDate: Joi.date().default(Date.now),
  totalDevicesActive: Joi.number(),
  classConductedHours: Joi.string(),
  feedback: Joi.string().allow(""),
  sectionID: Joi.string().custom(objectId),
  gradeID: Joi.string().custom(objectId),
});

const updateExperienceConducted = {
  params: Joi.object().keys({
    experienceId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    experienceID: Joi.string().custom(objectId),
    teacherID: Joi.string().custom(objectId),
    classStartTime: Joi.date(),
    classEndTime: Joi.date(),
    totalStudentsAttended: Joi.number(),
    schoolID: Joi.string().custom(objectId),
    conductedDate: Joi.date().default(Date.now),
    totalDevicesActive: Joi.number(),
    classConductedHours: Joi.string(),
    feedback: Joi.string().allow(""),
    sectionID: Joi.string().custom(objectId),
    gradeID: Joi.string().custom(objectId),
  }),
};

const getExperienceConducted = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getByIdExperienceConducted = Joi.object({
  id: Joi.string().custom(objectId),
});

const deleteExperienceConducted = Joi.object({
  id: Joi.string().custom(objectId),
});

const generatePerformanceReport = Joi.object({
  experience_conducted_id: Joi.string().custom(objectId),
});

module.exports = {
  createExperienceConducted,
  getByIdExperienceConducted,
  deleteExperienceConducted,
  getExperienceConducted,
  updateExperienceConducted,
  generatePerformanceReport,
};
