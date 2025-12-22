const mongoose = require("mongoose");
const CONSTANTS = require("../common/constants/constants");

const blockedUserSchema = new mongoose.Schema(
  {
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    blockedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure uniqueness (same user can't block another twice)
blockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

module.exports = mongoose.model("blocked-users", blockedUserSchema);
