const Joi = require("joi");

const {
  mongoId,
  offset,
  limit,
} = require("../common/validators/common.validators");

module.exports = {
  idInParams: {
    params: Joi.object({
      id: mongoId.required(),
    }),
  },

  updateUser: {
    body: Joi.object({
      profileImage: Joi.string().trim().required(),
    }),
  },
};
