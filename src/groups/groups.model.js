const mongoose = require("mongoose");
const {
  GROUP_TYPES,
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_DURATIONS,
  DISSAPEARING_DURATIONS,
} = require("./constants/groups.constants");

const { defaultGroupImage } = require("../../configs");

const groupsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    groupImage: {
      type: String,
      trim: true,
      default: defaultGroupImage,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    groupType: {
      type: String,
      enum: GROUP_TYPES,
      default: GROUP_TYPES.PUBLIC,
    },

    groupMembersCount: {
      type: Number,
      default: 1,
    },

    transferRequests: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
      },
    ],

    isSuperGroup: {
      type: Boolean,
      default: false,
    },

    // clearedBy: [
    //   {
    //     userId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "users",
    //     },
    //     messageId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "group-messages",
    //     },
    //   },
    // ],

    dissappearingMessages: {
      type: Boolean,
      default: false,
    },
    dissappearingMessagesDuration: {
      type: String,
      enum: DISSAPEARING_DURATIONS,
      default: DISSAPEARING_DURATIONS.NULL,
    },

    // lastMessage: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "group-messages",
    // },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("groups", groupsSchema);
