const Joi = require("joi");

const {
  mongoId,
  offset,
  limit,
} = require("../../common/validators/common.validators");

const {
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_DURATIONS,
  SUBSCRIPTION_STATUS,
} = require("../constants/groups.constants");

module.exports = {
  addParticipant: {
    body: Joi.object({
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
        .required(),

      groupId: mongoId.required(),
    }),
  },

  updateParticipant: {
    body: Joi.object({
      groupId: mongoId.required(),
    }),
  },
  approveParticipant: {
    body: Joi.object({
      groupId: mongoId.required(),
      status: Joi.string().valid("approved", "rejected").required(),
    }),
  },

  removeParticipant: {
    body: Joi.object({
      userId: mongoId.required(),
      groupId: mongoId.required(),
    }),
  },
  addAdmin: {
    body: Joi.object({
      userId: mongoId.required(),
      groupId: mongoId.required(),
      permissions: Joi.object({
        changeInfo: Joi.boolean().valid(true, false),
        postMessage: Joi.boolean().valid(true, false),
        deleteMessage: Joi.boolean().valid(true, false),
        pinMessage: Joi.boolean().valid(true, false),
        addRemoveSubscribers: Joi.boolean().valid(true, false),
        mamangeJoinRequests: Joi.boolean().valid(true, false),
        addNewAdmins: Joi.boolean().valid(true, false),
      }),
    }),
  },
  blockUser: {
    body: Joi.object({
      userId: mongoId.required(),
      groupId: mongoId.required(),
      isBlocked: Joi.boolean().valid(true, false).required(),
    }),
  },

  listParticipants: {
    query: Joi.object({
      offset,
      limit,
      groupId: mongoId.required(),
      isBlocked: Joi.boolean().valid(true, false),
    }),
  },
};
