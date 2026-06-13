const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      default: "", // شيلنا الـ required عشان نعرف نبعت ميديا صافية بدون نص
    },
    
    // === [حقول المرفقات الجديدة] ===
    fileUrl: {
      type: String,
      default: "",
    },
    fileType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file"],
      default: "text",
    },

    // === [حقل الـ Seen القديم (للشات الخاص)] ===
    seen: {
      type: Boolean,
      default: false,
    },

    // === [نظام الـ Seen By الجديد للمستقبل (للجروبات والشات الخاص)] ===
    seenBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        seenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    replyTo:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Message",
      default:null
    },
    isEdited:{
      type:Boolean,
      default:false
    },

    editedAt: {
      type: Date,
      default: null,
    },
    

    reactions:[{
      userId:{ 
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
      },
      username:{ type:String,},
      emoji:{ 
        type:String,
      }
    
    }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);