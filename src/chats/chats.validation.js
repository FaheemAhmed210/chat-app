const Joi = require("joi");

const {
  MESSAGE_STATUS,
  MUTE_DURATION,
} = require("./constants/chats.constants");

const {
  mongoId,
  offset,
  limit,
} = require("../common/validators/common.validators");

module.exports = {
  create: {
    body: Joi.object({
      participant: mongoId.required(),
    }),
  },
  mongoDBIdInParams: {
    params: Joi.object({
      id: mongoId.required(),
    }),
  },
  listChats: {
    query: Joi.object({
      offset,
      limit,
      search: Joi.string().trim().optional(),
    }),
  },

  muteChat: {
    body: Joi.object({
      isMuted: Joi.boolean().valid(true, false).required(),
      duration: Joi.string()
        .valid(...Object.values(MUTE_DURATION))
        .when("isMuted", {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
    }),
  },

  updateStatus: {
    params: Joi.object({
      id: mongoId.required(),
    }),
    body: Joi.object({
      status: Joi.string()
        .valid(...Object.values(MESSAGE_STATUS))
        .required(),
    }),
  },

  deleteChat: {
    params: Joi.object({
      id: mongoId.required(),
    }),
    body: Joi.object({
      status: Joi.string()
        .valid(...Object.values(MESSAGE_STATUS))
        .required(),
    }),
  },
};
