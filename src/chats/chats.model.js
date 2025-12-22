const mongoose = require("mongoose");

const chatsSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
    ],

    firstMessageSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chatsSchema.index({ participants: 1 });

module.exports = mongoose.model("chats", chatsSchema);
