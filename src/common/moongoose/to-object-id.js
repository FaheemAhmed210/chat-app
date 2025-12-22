const mongoose = require("mongoose");

exports.toObjectId = (value) => {
  if (!value) return null;

  // Already an ObjectId
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  // Hex string → ObjectId
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return mongoose.Types.ObjectId.createFromHexString(value);
  }

  // Invalid value
  throw new Error("Invalid ObjectId value: " + value);
};
