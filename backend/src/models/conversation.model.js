const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  unreadCounts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    count: {
      type: Number,
      default: 0,
    },
  }],
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],

    isGroup: {
      type: Boolean,
      default: false,
    },

    groupAdmin: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    groupName: {
      type: String,
      default: "",
    },

    groupImage: {
      type: String,
      default: "",
    },

    groupDescription: {
      type: String,
      default: "",
    },

    adminPermission: {
      type: Boolean,
      default: false,
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);