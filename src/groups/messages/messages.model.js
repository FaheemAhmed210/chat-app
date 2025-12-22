const mongoose = require("mongoose");
const {
  GROUP_MESSAGE_TYPES,
  MESSAGE_STATUS,
  VIEW_TYPE,
  VIEW_STATUS,
} = require("../constants/groups.constants");

const groupMessagesSchema = new mongoose.Schema(
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

    reciever: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "groups",
      required: true,
    },
    content: {
      body: { type: String, required: true },
      type: {
        type: String,
        enum: GROUP_MESSAGE_TYPES,
        default: GROUP_MESSAGE_TYPES.TEXT,
      },
      metaData: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "group-messages",
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

    messageStatus: {
      type: String,
      enum: MESSAGE_STATUS,
      default: MESSAGE_STATUS.SENT,
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
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

groupMessagesSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model("group-messages", groupMessagesSchema);
