const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      trim: true,
    },
    file: {
      url: { type: String, default: null },
      fileName: { type: String, default: null },
      fileType: { type: String, default: null }, // 'image', 'video', 'audio', 'document'
      fileSize: { type: Number, default: 0 },
      mimeType: { type: String, default: null },
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],
    callInfo: {
      isCall: { type: Boolean, default: false },
      isVideoCall: { type: Boolean, default: false },
      isMissed: { type: Boolean, default: false },
      duration: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);