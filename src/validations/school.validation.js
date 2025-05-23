const Joi = require("joi");

const createSchoolSchema = {
  body: Joi.object({
    schoolName: Joi.string().required(),
    schoolAddress: Joi.string().required(),
    schoolType: Joi.string().required(),
    gradeLevelsServed: Joi.string().required(),
    schoolDistrict: Joi.string().required(),
    schoolIdentificationNumber: Joi.string().required(),
    schoolEmail: Joi.string().email().required(),
    schoolPhoneNumber: Joi.string().required(),
    isSubscribed: Joi.boolean(),
    maxAllowedDevice: Joi.number(),
    users: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          role: Joi.string().valid("superadmin", "admin", "teacher").required(),
          password: Joi.string().required(),
        })
      )
      .required(),
    subscriptionId: Joi.string().required(),
  }),
};

const updateSchoolSchema = {
  params: Joi.object({
    schoolId: Joi.string().required(),
  }),
  body: Joi.object({
    schoolName: Joi.string(),
    schoolAddress: Joi.string(),
    schoolType: Joi.string(),
    gradeLevelsServed: Joi.string(),
    schoolDistrict: Joi.string(),
    schoolIdentificationNumber: Joi.string(),
    schoolEmail: Joi.string().email(),
    schoolPhoneNumber: Joi.string(),
    subscriptionId: Joi.string(),
    maxAllowedDevice: Joi.number(),
    isSubscribed: Joi.boolean(),
    isActive: Joi.boolean(),
    subscriptionRemainingDays: Joi.string(),
  }),
};

const getSchoolSchema = {
  params: Joi.object({
    schoolId: Joi.string().required(),
  }),
};

const getAllSchoolsSchema = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
  }),
};

const deleteSchoolSchema = {
  params: Joi.object({
    schoolId: Joi.string().required(),
  }),
};

module.exports = {
  createSchoolSchema,
  updateSchoolSchema,
  getSchoolSchema,
  deleteSchoolSchema,
  getAllSchoolsSchema,
};
