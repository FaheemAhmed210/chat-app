const Joi = require("joi");

const {
  mongoId,
  offset,
  limit,
} = require("../../common/validators/common.validators");

const {
  GROUP_MESSAGE_TYPES,
  MESSAGE_ACCESS_TYPES,
  UPATE_MESSAGE_STATUS,
  DELETE_TYPE,
  VIEW_TYPE,
  VIEW_STATUS,
  PIN_DURATIONS,
} = require("../constants/groups.constants");

module.exports = {
  create: {
    body: Joi.object({
      groupId: mongoId.required(),
      replyTo: mongoId.allow(null),
      content: Joi.object({
        body: Joi.string().required(),
        type: Joi.string().valid(...Object.values(GROUP_MESSAGE_TYPES)),
        metaData: Joi.any().optional(),
      }).required(),
      viewType: Joi.string().valid(...Object.values(VIEW_TYPE)),
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

  updateStatus: {
    params: Joi.object({
      id: mongoId.required(),
    }),
    body: Joi.object({
      status: Joi.string()
        .valid(...Object.values(UPATE_MESSAGE_STATUS))
        .required(),
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

  deleteMessages: {
    body: Joi.object({
      messageIds: Joi.array().items(mongoId).min(1).required(),
      deleteType: Joi.string()
        .valid(...Object.values(DELETE_TYPE))
        .required(),
    }),
  },

  pinMessage: {
    body: Joi.object({
      messageId: mongoId.required(),
      duration: Joi.string()
        .valid(...Object.values(PIN_DURATIONS))
        .required(),
    }),
  },
  listMessages: {
    query: Joi.object({
      nextCursor: mongoId,
      limit,
      groupId: mongoId.required(),
      types: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()))
        .optional(),
    }),
  },
};
