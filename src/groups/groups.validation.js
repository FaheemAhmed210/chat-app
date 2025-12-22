const Joi = require("joi");

const {
  GROUP_TYPES,
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_DURATIONS,
  DISSAPEARING_DURATIONS,
  SUBSCRIPTION_STATUS,
  MUTE_DURATION,
  UPATE_MESSAGE_STATUS,
} = require("./constants/groups.constants");

const {
  mongoId,
  offset,
  limit,
} = require("../common/validators/common.validators");

module.exports = {
  create: {
    body: Joi.object({
      name: Joi.string().required(),
      groupImage: Joi.string().optional(),
      description: Joi.string().optional(),
      groupType: Joi.string()
        .valid(...Object.values(GROUP_TYPES))
        .optional(),

      participants: Joi.array()
        .items(
          Joi.object({
            userId: mongoId.required(),
          })
        )
        .min(1)
        .messages({
          "array.min": "At least one participant is required",
          "array.unique": "Duplicate participants are not allowed",
        })
        .unique((a, b) => a.userId.toString() === b.userId.toString())
        .required(), // require at least one participant,

      dissappearingMessages: Joi.boolean().valid(true, false).optional(),
      dissappearingMessagesDuration: Joi.string()
        .valid(...Object.values(DISSAPEARING_DURATIONS))
        .optional(),
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

  getAllGroups: {
    query: Joi.object({
      limit,
      offset,
    }),
  },

  transferOwnership: {
    body: Joi.object({
      userId: mongoId.required(),
    }),
  },
  idInParams: {
    params: Joi.object({
      id: mongoId.required(),
    }),
  },

  getGroupById: {
    params: Joi.object({
      id: mongoId.required(),
    }),
  },
  joinGroup: {
    body: Joi.object({}),
  },

  update: {
    params: Joi.object({
      id: mongoId.required(),
    }),
    body: Joi.object({
      name: Joi.string().optional(),
      groupImage: Joi.string().optional(),
      description: Joi.string().optional(),
      groupType: Joi.string()
        .valid(...Object.values(GROUP_TYPES))
        .optional(),
      dissappearingMessages: Joi.boolean().valid(true, false).optional(),
      dissappearingMessagesDuration: Joi.string()
        .valid(...Object.values(DISSAPEARING_DURATIONS))
        .optional(),
    }),
  },

  groupIdinParams: {
    params: Joi.object({
      id: mongoId.required(),
    }),
  },

  mongoDBIdInParams: {
    params: Joi.object({
      id: mongoId.required(),
    }),
  },
  muteGroup: {
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
};
