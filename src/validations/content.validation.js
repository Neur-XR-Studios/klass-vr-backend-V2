const Joi = require("joi");
const { objectId } = require("./custom.validation");

const modelDetailSchema = Joi.object().keys({
  _id: Joi.string().custom(objectId),
  script: Joi.string().allow(""),
  modelId: Joi.string().custom(objectId),
  modelCoordinates: Joi.string().optional(),
  displayTime: Joi.string(),
  modelUrl: Joi.string().optional(),
});

const videoDetailSchema = Joi.object().keys({
  _id: Joi.string().custom(objectId),
  script: Joi.string().allow(""),
  VideoId: Joi.string().custom(objectId),
  videoSound: Joi.string().optional(),
  videoURL: Joi.string().optional(),
});

const imageDetailSchema = Joi.object().keys({
  _id: Joi.string().custom(objectId),
  script: Joi.string().allow(""),
  ImageId: Joi.string().custom(objectId),
  ImageURL: Joi.string().optional(),
  displayTime: Joi.string(),
});

const simulationDetailSchema = Joi.object().keys({
  _id: Joi.string().custom(objectId),
  script: Joi.string().allow(""),
  simulationId: Joi.string().custom(objectId),
  simulationURL: Joi.string().optional(),
  displayTime: Joi.string(),
});

const createContent = {
  body: Joi.object().keys({
    sessionId: Joi.string().custom(objectId),
    script: Joi.string().allow(""),
    modelDetails: Joi.array().items(modelDetailSchema),
    videoDetails: Joi.array().items(videoDetailSchema),
    imageDetails: Joi.array().items(imageDetailSchema),
    simulationDetails: Joi.array().items(simulationDetailSchema),
    teacherCharacterGender: Joi.string().valid("male", "female"),
    createdBy: Joi.string().custom(objectId),
    schoolId: Joi.string().custom(objectId),
    isDraft: Joi.boolean(),
    language: Joi.string().valid("arabic", "spanish", "english"),
    youTubeUrl: Joi.string().allow(""),
    youTubeVideoAudio: Joi.boolean().allow(""),
    youTubeVideoScript: Joi.string().allow(""),
    youTubeStartTimer: Joi.string().allow(""),
    youTubeEndTimer: Joi.string().allow(""),
    classEnvironment: Joi.string().allow(""),
  }),
};

const getContent = {
  params: Joi.object().keys({
    contentId: Joi.string().custom(objectId),
  }),
};

const getContents = {
  query: Joi.object().keys({
    title: Joi.string(),
    createdBy: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateContent = {
  params: Joi.object().keys({
    contentId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    sessionId: Joi.string().custom(objectId),
    script: Joi.string().allow(""),
    modelDetails: Joi.array().items(modelDetailSchema),
    videoDetails: Joi.array().items(videoDetailSchema),
    imageDetails: Joi.array().items(imageDetailSchema),
    simulationDetails: Joi.array().items(simulationDetailSchema),
    teacherCharacterGender: Joi.string().valid("male", "female"),
    createdBy: Joi.string().custom(objectId),
    schoolId: Joi.string().custom(objectId),
    isDraft: Joi.boolean(),
    language: Joi.string().valid("arabic", "spanish", "english"),
    youTubeUrl: Joi.string().allow(""),
    youTubeVideoAudio: Joi.boolean().allow(""),
    youTubeVideoScript: Joi.string().allow(""),
    youTubeStartTimer: Joi.string().allow(""),
    youTubeEndTimer: Joi.string().allow(""),
    classEnvironment: Joi.string().allow(""),
  }),
};

const deleteContent = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const viewContent = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const updateModelDetails = {
  params: Joi.object().keys({
    contentId: Joi.string().custom(objectId),
  }),
  body: Joi.object({
    modelDetails: Joi.array()
      .items(
        Joi.object({
          _id: Joi.string().required(),
          modelCoordinates: Joi.string().required(),
        })
      )
      .required(),
  }),
};

module.exports = {
  createContent,
  getContents,
  getContent,
  updateContent,
  deleteContent,
  viewContent,
  updateModelDetails,
};
