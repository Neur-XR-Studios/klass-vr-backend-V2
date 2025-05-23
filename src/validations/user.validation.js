const Joi = require("joi");
const { password, objectId } = require("./custom.validation");

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string()
      .required()
      .valid("user", "admin", "superadmin", "teacher"),
    schoolId: Joi.string().custom(objectId),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUserProfile = {
  body: Joi.object()
    .keys({
      username: Joi.string().min(3).max(30).trim(),
    }),
  file: Joi.object().keys({
    fieldname: Joi.string(),
    originalname: Joi.string(),
    encoding: Joi.string(),
    mimetype: Joi.string().valid("image/jpg", "image/jpeg", "image/png", "image/gif"),
    buffer: Joi.any(),
  }),
};

const importTeachers = Joi.object({
  file: Joi.object({
    mimetype: Joi.string()
      .valid('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .required()
      .messages({ 'any.only': 'Only .xlsx files are allowed!' }),

    size: Joi.number()
      .max(2 * 1024 * 1024) // 2MB limit
      .required()
      .messages({ 'number.max': 'File size should not exceed 2MB!' }),
  }).required().messages({ 'any.required': 'File is required!' }),
});


module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserProfile,
  importTeachers
};
