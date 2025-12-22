const mongoose = require("mongoose");

const blockedMembersSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "groups",
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

module.exports = mongoose.model("blocked-members", blockedMembersSchema);
