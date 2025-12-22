const mongoose = require("mongoose");

const messageStatusSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "group-messages",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "groups",
      required: true,
    },

    openedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        openedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

messageStatusSchema.index({ messageId: 1, createdAt: -1 });

module.exports = mongoose.model(
  "group-message-open-status",
  messageStatusSchema
);
