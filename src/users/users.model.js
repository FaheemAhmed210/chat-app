const mongoose = require("mongoose");
const CONSTANTS = require("../common/constants/constants");
async function generateReferralCode() {
  const referralCodes = await import("referral-codes");
  return referralCodes.generate({
    length: 10,
    count: 1,
    charset: referralCodes.charset("alphanumeric"),
  })[0];
}
const { defaultUserImage } = require("../../configs");

const usersSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      sparse: true,
    },

    displayName: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },
    walletAddress: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      sparse: true,
    },

    btcWalletAddress: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    solanaWalletAddress: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    tronWalletAddress: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: CONSTANTS.ROLES,
      default: CONSTANTS.ROLES.USER,
    },
    profileImage: {
      type: String,
      trim: true,
      default: defaultUserImage,
    },

    udid: {
      type: String,
      trim: true,
    },

    referalCode: {
      type: String,
      unique: true,
      trim: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    waitingList: {
      type: Boolean,
      default: true,
    },

    level: {
      type: Number,
      enum: CONSTANTS.REFFERAL_LEVELS,
      default: CONSTANTS.REFFERAL_LEVELS.ZERO,
    },

    referralTree: {
      level1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      }, // Direct referrer
      level2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      }, // Referrer of the referrer
      level3: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      }, // 3rd level upline
    },

    fcmToken: {
      type: String,
      trim: true,
    },
    platformName: {
      type: String,
      trim: true,
    },

    deviceModel: {
      type: String,
      trim: true,
    },
    osVersion: {
      type: String,
      trim: true,
    },
    version: {
      type: String,
      trim: true,
    },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// pre-save hook to set referral code if not set
usersSchema.pre("save", async function (next) {
  if (!this.referalCode) {
    this.referalCode = await generateReferralCode();
  }
  next();
});

module.exports = mongoose.model("users", usersSchema);
