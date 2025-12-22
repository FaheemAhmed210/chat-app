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
    totalCount: {
      type: Number,
      default: 0,
    },
    seenCount: {
      type: Number,
      default: 0,
    },
    deliveredCount: {
      type: Number,
      default: 0,
    },

    seenBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        seenAt: { type: Date, default: Date.now },
      },
    ],
    deliveredTo: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        deliveredAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

messageStatusSchema.index({ messageId: 1, createdAt: -1 });

module.exports = mongoose.model("group-message-status", messageStatusSchema);
