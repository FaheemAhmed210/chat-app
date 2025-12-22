const Joi = require("joi");

const { mongoId } = require("../common/validators/common.validators");

module.exports = {
  create: {
    body: Joi.object({
      userId: mongoId.required(),
      isBlocked: Joi.boolean().valid(true, false).required(),
    }),
  },
};
