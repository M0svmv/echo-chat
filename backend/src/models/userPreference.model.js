const mongoose = require("mongoose");

const userPreferenceSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        targetUser:{type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        type:{
            type:String,
            enum: ["close_friend", "block"],
            required: true
        }
    },
    { timestamps: true }
);

userPreferenceSchema.index({ user: 1, targetUser: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("userPreference", userPreferenceSchema);