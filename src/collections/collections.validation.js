const Joi = require("joi");

const {
  mongoId,
  offset,
  limit,
} = require("../common/validators/common.validators");

module.exports = {
  mongoDBIdInParams: {
    params: Joi.object({
      id: mongoId.required(),
    }),
  },
  listCollections: {
    query: Joi.object({
      offset,
      limit,
      search: Joi.string().trim().optional(),
    }),
  },
};
