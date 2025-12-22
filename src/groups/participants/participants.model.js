const mongoose = require("mongoose");

const groupParticipantsSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "groups",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isOwner: {
      type: Boolean,
      default: false,
    },
    // isMuted: {
    //   type: Boolean,
    //   default: false,
    // },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // muteType: {
    //   type: String,
    //   enum: MUTE_DURATION,
    //   default: MUTE_DURATION.NEVER,
    // },
    // mutedTill: {
    //   type: Date,
    // },
    isApproved: {
      type: Boolean,
      default: false,
    },

    permissions: {
      changeInfo: {
        type: Boolean,
        default: false,
      },
      postMessage: {
        type: Boolean,
        default: false,
      },
      deleteMessage: {
        type: Boolean,
        default: false,
      },
      pinMessage: {
        type: Boolean,
        default: false,
      },
      addRemoveSubscribers: {
        type: Boolean,
        default: false,
      },
      mamangeJoinRequests: {
        type: Boolean,
        default: false,
      },
      addNewAdmins: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

groupParticipantsSchema.index({ groupId: 1, createdAt: -1 });
groupParticipantsSchema.index({ groupId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("group-participants", groupParticipantsSchema);
