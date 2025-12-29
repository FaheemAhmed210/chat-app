const mongoose = require("mongoose");
const CONSTANTS = require("../common/constants/constants");
const { defaultUserImage } = require("../../configs");
const bcrypt = require("bcryptjs");
const usersSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: true,
    },

    displayName: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      trim: true,
      required: true,
      // select: false,
    },

    passwordResetToken: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      select: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      select: false,
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

    isBlocked: {
      type: Boolean,
      default: false,
    },

    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.deletedAt;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.deletedAt;
        return ret;
      },
    },
  }
);

usersSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.isDeleted = true;
  return this.save();
};

usersSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usersSchema.methods.isPasswordValid = function (password) {
  return bcrypt.compareSync(password, this.password);
};

usersSchema.methods.isResetTokenValid = function (token) {
  return token === this.passwordResetToken;
};
module.exports = mongoose.model("users", usersSchema);
