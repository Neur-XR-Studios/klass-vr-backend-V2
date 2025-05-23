const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createAssessment = {
  body: Joi.array()
    .items(
      Joi.object().keys({
        question: Joi.string().required(),
        options: Joi.array()
          .items(
            Joi.object({
              text: Joi.string().required(),
              isCorrect: Joi.boolean().required(),
            })
          )
          .required(),
        createdBy: Joi.string().custom(objectId),
        sessionId: Joi.string().custom(objectId).optional(),
        typeOfGame: Joi.string().required(),
        assessmentId: Joi.string(),
      })
    )
    .required(),
  isDraft: Joi.boolean(),
};

const getAssessments = {
  query: Joi.object().keys({
    question: Joi.string(),
    options: Joi.array().items(
      Joi.object({
        text: Joi.string(),
        isCorrect: Joi.boolean(),
      })
    ),
    createdBy: Joi.alternatives().try(
      Joi.string().custom(objectId),
      Joi.object().custom(objectId)
    ),
    sessionId: Joi.alternatives().try(
      Joi.string().custom(objectId),
      Joi.object().custom(objectId)
    ),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getAssessment = {
  params: Joi.object().keys({
    assessmentId: Joi.string().custom(objectId),
  }),
};

const updateAssessment = {
  query: Joi.object({
    sessionId: Joi.string().required().optional(),
  }),
  body: Joi.array()
    .items(
      Joi.object().keys({
        id: Joi.string().optional(),
        assessmentId: Joi.string(),
        question: Joi.string().required(),
        options: Joi.array()
          .items(
            Joi.object({
              text: Joi.string().required(),
              isCorrect: Joi.boolean().required(),
            })
          )
          .min(1)
          .required(),
        isDraft: Joi.boolean(),
        typeOfGame: Joi.string()
          .valid("Archery", "Basketball", "MCQ")
          .required(),
        sessionId: Joi.string().custom(objectId).optional(),
      })
    )
    .empty(Joi.array().length(0)),
};

const deleteAssessment = {
  params: Joi.object().keys({
    assessmentId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
};
