const Joi = require("joi");
module.exports = {
  envSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid("development", "production", "local")
      .required(),
    PORT: Joi.number().required(),
    JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
    JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
    DATABASE_URI: Joi.string().required(),

    // AWS S3 Credentials
    AWS_ACCESS_KEY: Joi.string().required(),
    AWS_ACCESS_SECRET: Joi.string().required(),
    AWS_S3_BUCKET_NAME: Joi.string().required(),
    AWS_S3_BUCKET_REGION: Joi.string().required(),
    AWS_S3_CLOUD_FRONT_URL: Joi.string().required(),
  }).unknown(), //ignores extra variables that exist in process.env
};
