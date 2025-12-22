const mongoose = require("mongoose");

const { PIN_DURATIONS } = require("../constants/groups.constants");

const groupPinnedMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "groups",
      unique: true, // ensure only one doc per group
      required: true,
    },
    pinnedMessages: [
      {
        messageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "group-messages",
          required: true,
        },
        pinnedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
        pinnedAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        duration: {
          type: String,
          enum: PIN_DURATIONS,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "group-pinned-message",
  groupPinnedMessageSchema
);
