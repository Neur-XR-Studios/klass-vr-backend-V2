const Joi = require('joi');

const OptionSchema = Joi.object({
  text: Joi.string(),
  isCorrect: Joi.boolean(),
});

const AssessmentSchema = Joi.object({
  id: Joi.string(),
  question: Joi.string(),
  options: Joi.array().items(OptionSchema),
});

const UserSchema = Joi.object({
  id: Joi.string(),
  email: Joi.string().email(),
  name: Joi.string(),
  role: Joi.string(),
});

const ContentSchema = Joi.object({
  sessionId: Joi.string(),
  script: Joi.string(),
  modelName: Joi.string(),
  model: Joi.string(),
  modelFormat: Joi.string().valid('.fbx'),
  image: Joi.string(),
  imageFormat: Joi.string().valid('.jpg'),
});

const SessionSchema = Joi.object({
  _id: Joi.string(),
  sessionId: Joi.string(),
  sessionTimeAndDate: Joi.string().isoDate(),
  grade: Joi.string(),
  sectionOrClass: Joi.string(),
  sessionStatus: Joi.string(),
  teacherId: UserSchema,
  subject: Joi.string(),
  feedback: Joi.string(),
  sessionDuration: Joi.number(),
  isDeployed: Joi.boolean(),
});

const ExperienceItemSchema = Joi.object({
  session: SessionSchema.required(),
  assessments: Joi.array().items(AssessmentSchema),
  contents: Joi.array().items(ContentSchema),
});

const getDeployedSessionsWithAssessmentsAndContentsValidation = Joi.array().items(ExperienceItemSchema);

module.exports = {
  getDeployedSessionsWithAssessmentsAndContentsValidation,
};
