const Joi = require("joi");

const {
  CHAT_MESSAGE_TYPES,
  MESSAGE_STATUS,

  DELETE_TYPE,
  VIEW_TYPE,
  VIEW_STATUS,
} = require("../constants/chats.constants");

const {
  mongoId,
  offset,
  limit,
} = require("../../common/validators/common.validators");

module.exports = {
  create: {
    body: Joi.object({
      chatId: mongoId.required(),
      replyTo: mongoId.allow(null),
      content: Joi.object({
        body: Joi.string().required(),
        type: Joi.string().valid(...Object.values(CHAT_MESSAGE_TYPES)),
        metaData: Joi.any().optional(),
      }).required(),
      viewType: Joi.string().valid(...Object.values(VIEW_TYPE)),
    }),
  },

  update: {
    params: Joi.object({
      id: mongoId.required(),
    }),
    body: Joi.object({
      content: Joi.object({
        body: Joi.string().optional(),
        metaData: Joi.any().optional(),
      }).optional(),
      isEdited: Joi.boolean().default(true),
    }),
  },

  reactToMesage: {
    params: Joi.object({
      id: mongoId.required(),
    }),
    body: Joi.object({
      emoji: Joi.string().trim(),
      slug: Joi.string().trim(),
      name: Joi.string().trim(),
    }),
  },

  deleteMessages: {
    body: Joi.object({
      messageIds: Joi.array().items(mongoId).min(1).required(),
      deleteType: Joi.string()
        .valid(...Object.values(DELETE_TYPE))
        .required(),
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
  updateSingleViewStatus: {
    params: Joi.object({
      id: mongoId.required(),
    }),
    body: Joi.object({
      status: Joi.string().valid(VIEW_STATUS.OPENED).required(),
    }),
  },
  delete: {
    params: Joi.object({
      id: mongoId.required(),
    }),
    body: Joi.object({
      deleteType: Joi.string()
        .valid(...Object.values(DELETE_TYPE))
        .required(),
    }),
  },

  listMessages: {
    query: Joi.object({
      cursor: Joi.string().trim().optional(),
      limit,
      chatId: mongoId.required(),
      types: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()))
        .optional(),
    }),
  },
};
