const mongoose = require("mongoose");

const {
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  MESSAGE_ACCESS_TYPES,
  VIEW_TYPE,
  VIEW_STATUS,
} = require("../../common/constants/collection.constants");

const chatMessagesSchema = new mongoose.Schema(
  {
    sender: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      userName: {
        type: String,
        trim: true,
      },

      displayName: {
        type: String,
        trim: true,
      },

      profileImage: {
        type: String,
        trim: true,
      },
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chats",
      required: true,
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chat-messages",
      default: null,
    },

    reactedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        name: { type: String, trim: true },
        emoji: { type: String, trim: true },
        slug: { type: String, trim: true },
      },
    ],

    content: {
      body: { type: String, required: true },
      type: {
        type: String,
        enum: MESSAGE_TYPES,
        default: MESSAGE_TYPES.TEXT,
      },
      metaData: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    viewType: {
      type: String,
      enum: VIEW_TYPE,
      default: VIEW_TYPE.STANDARD,
    },

    viewStatus: {
      type: String,
      enum: VIEW_STATUS,
      default: VIEW_STATUS.NULL,
    },

    status: {
      type: String,
      enum: MESSAGE_STATUS,
      default: MESSAGE_STATUS.DELIVERED,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],

    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chatMessagesSchema.index({ chatId: 1, createdAt: -1 });

module.exports = mongoose.model("chat-messages", chatMessagesSchema);
