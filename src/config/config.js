const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    AWS_ACCESS_KEY_ID: Joi.string().required().description('AWS Access Key ID'),
    AWS_SECRET_ACCESS_KEY: Joi.string().required().description('AWS Secret Access Key'),
    AWS_REGION: Joi.string().required().description('AWS Region'),
    AWS_S3_BUCKET: Joi.string().default('klass-vr-file').description('AWS S3 Bucket for videos'),
    YOUTUBE_COOKIE: Joi.string().allow(''),
    YOUTUBE_IDENTITY_TOKEN: Joi.string().allow(''),
    YOUTUBE_USER_AGENT: Joi.string().allow(''),
    YOUTUBE_COOKIE_FILE: Joi.string().allow(''),
    YOUTUBE_USER_AGENT: Joi.string().allow(''),

  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {},
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
    s3Bucket: envVars.AWS_S3_BUCKET,
  },
  youtube: {
    cookie: envVars.YOUTUBE_COOKIE || null, // 'chrome', 'firefox', or path to cookie file
    cookieFile: envVars.YOUTUBE_COOKIE_FILE
      ? path.resolve(process.cwd(), envVars.YOUTUBE_COOKIE_FILE)
      : path.resolve(process.cwd(), 'youtube-cookies.txt'),
    userAgent: envVars.YOUTUBE_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    email: process.env.YOUTUBE_EMAIL,
    password: process.env.YOUTUBE_PASSWORD,
    cookiePath: process.env.YOUTUBE_COOKIE_PATH || path.join(__dirname, '../../youtube-cookies.txt'),
  },
};
