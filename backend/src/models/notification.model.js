const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        sender:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        type:{
            type: String,
            required: true
        },

        title: {
            type: String,
        },
        body: {
            type: String,
        },
        data: {
            type: Object,
        },
        isRead: {
            type: Boolean,
            default: false
        },

    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);