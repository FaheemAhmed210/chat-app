const mongoose = require("mongoose");

const blockedMembersSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "groups",
      default: null,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "channels",
      default: null,
    },
    blockedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true }
);

// Unique per user per group
blockedMembersSchema.index(
  { blockedId: 1, groupId: 1 },
  { unique: true, partialFilterExpression: { groupId: { $exists: true } } }
);

// Unique per user per channel
blockedMembersSchema.index(
  { blockedId: 1, channelId: 1 },
  { unique: true, partialFilterExpression: { channelId: { $exists: true } } }
);

module.exports = mongoose.model("blocked-members", blockedMembersSchema);
