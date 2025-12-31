const mongoose = require("mongoose");
const {
  COLLECTION_TYPES,

  MUTE_DURATION,
  MESSAGE_TYPES,
} = require("./constants/collections.constants");

const collectionsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type", // dynamic reference
    },
    collectionName: {
      type: String,
      trim: true,
      required: true,
    },
    collectionImage: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      enum: COLLECTION_TYPES,
      default: COLLECTION_TYPES.CHATS,
    },
    otherUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "group-participants",
    },

    isMuted: {
      type: Boolean,
      default: false,
    },
    muteType: {
      type: String,
      enum: MUTE_DURATION,
      default: MUTE_DURATION.NEVER,
    },
    mutedTill: {
      type: Date,
    },
    clearedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },

    lastMessageRead: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "messageType",
      default: null,
    },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    unreadCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

collectionsSchema.index({ userId: 1 });
collectionsSchema.index({ collectionId: 1 });

module.exports = mongoose.model("collections", collectionsSchema);
