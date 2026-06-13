const Message = require("../../../models/message.model");
const Conversation = require("../../../models/conversation.model");
const UserPreference = require("../../../models/userPreference.model");

exports.sendMessage = async (req, res) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    const senderId = req.user._id;
    const { conversationId, text,replyTo } = req.body;

    if (!conversationId) return res.status(400).json({ message: "Conversation ID is required" });

 
    let fileUrl = "";
    let fileType = "text";

    if (req.file) {
      
      fileUrl = req.file.path; 
      
      
      const mime = req.file.mimetype;
      if (mime.startsWith("image/")) fileType = "image";
      else if (mime.startsWith("video/")) fileType = "video";
      else if (mime.startsWith("audio/")) fileType = "audio"; 
      else fileType = "file"; 
    }

   
    if (!text && !fileUrl) {
      return res.status(400).json({ message: "Cannot send an empty message" });
    }

    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    // ==================== [منطق التفرقة في الحظر] ====================
    if (!conversation.isGroup) {
      const targetUserId = conversation.participants.find(
        (id) => id.toString() !== senderId.toString()
      );

      if (targetUserId) {
        const iBlockedThem = await UserPreference.findOne({
          user: senderId,
          targetUser: targetUserId,
          type: "block"
        });

        if (iBlockedThem) {
          return res.status(403).json({ 
            message: "You have blocked this user. Unblock them to send messages." 
          });
        }

        const theyBlockedMe = await UserPreference.findOne({
          user: targetUserId,
          targetUser: senderId,
          type: "block"
        });

        if (theyBlockedMe) {
          return res.status(403).json({ 
            message: "Cannot send message. This user has blocked you." 
          });
        }
      }
    }
    // =============================================================

    // 1. إنشاء الرسالة أولاً في قاعدة البيانات
    const newMessage = await Message.create({
      conversationId,
      sender: senderId,
      text: text || "", 
      fileUrl,
      fileType,
      replyTo: replyTo || null
    });

    
    const message = await newMessage.populate([
      { path: "sender", select: "firstName lastName username avatar" },
      { 
        path: "replyTo", 
        populate: { path: "sender", select: "firstName lastName username" } 
      }
    ]);

    // 2. تحديث الـ unreadCounts و الـ lastMessage برمجياً وبشكل آمن تماماً
    // بنلف على كل المشاركين، وأي حد مش هو المرسل بنزود عداده أو ننشأه لو المصفوفة فاضية
    if (!conversation.unreadCounts) conversation.unreadCounts = [];

    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== senderId.toString()) {
        const userUnread = conversation.unreadCounts.find(
          (u) => u.user.toString() === participantId.toString()
        );

        if (userUnread) {
          userUnread.count += 1; // لو الأوبجكت موجود نزود العداد
        } else {
          // لو المصفوفة فاضية أو ملوش أوبجكت، بننشأ أوبجكت جديد بقيمة 1
          conversation.unreadCounts.push({
            user: participantId,
            count: 1
          });
        }
      }
    });

    // تعيين آخر رسالة وتحديث وقت المحادثة لتصعد للأعلى
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    
    // حفظ التعديلات الجذرية في قاعدة البيانات
    await conversation.save();

    // 3. جلب بيانات المحادثة المحدثة كاملة وعمل Populate شامل قبل إرسال السوكت
    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName username avatar")
      .populate("groupAdmin", "firstName lastName username avatar")
      .populate("unreadCounts.user", "_id") // جلب الـ ID لتطابق شروط الفرونت إيند
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username firstName lastName",
        },
      });

    // 4. إرسال الأحداث لايف للمستخدمين عبر السوكت
    conversation.participants.forEach((participantId) => {
      const socketId = onlineUsers?.get(participantId.toString());
      if (socketId) {
        // إرسال المحادثة والعداد الجديد المحدث من السيرفر
        io.to(socketId).emit("conversationUpdated", {
          ...updatedConversation.toObject(),
          hasNewMessage: true,
        });

        // إرسال الرسالة الحقيقية للطرف الآخر
        if (participantId.toString() !== senderId.toString()) {
          io.to(socketId).emit("newMessage", {
            ...message.toObject(),
            conversationId,
          });
        }
      }
    });

   

    return res.status(201).json(message);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const messages = await Message.find({ conversationId })
      .populate("sender", "firstName lastName username")
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "firstName lastName username",
        },
      });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.editMessage = async (req,res)=>{
  try{
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const senderId = req.user._id;
    const {messageId} = req.params;
    const {newText} = req.body;

    if(!newText)return res.status(400).json({message:"Text is required"});

    const message = await Message.findById(messageId);
    if(!message)return res.status(404).json({message:"Message not found"});

    if(message.sender.toString() !== senderId.toString()){
      return res.status(403).json({message:"You are not authorized to edit this message"});
    }

    message.text = newText;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    
    conversation.participants.forEach((participantId)=>{
      const socketId = onlineUsers?.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("messageEdited", {
          messageId: message._id,
          conversationId: message.conversationId,
          newText: message.text,
          isEdited: true
        });
      }
    
    });

    return res.status(200).json(message);
  }catch(err){
    console.log(err);
    return res.status(500).json({message:"Internal server error"});
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const userId = req.user._id;
    const { messageId } = req.params;
    const { emoji } = req.body; // الإيموجي المختار

    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (!message.reactions) message.reactions = [];

    // البحث هل للمستخدم تفاعل قديم على هذه الرسالة؟
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      // لو نفس الإيموجي اضغط عليه تاني -> احذفه (Toggle)
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // لو إيموجي مختلف -> حدّث التفاعل بالإيموجي الجديد
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // تفاعل جديد تماماً للمستخدم
      message.reactions.push({
        userId,
        username: req.user.username,
        emoji
      });
    }

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);

    // إرسال التحديث لايف بالسوكت لجميع أطراف المحادثة لتحديث الـ UI فوراً
    conversation.participants.forEach((participantId) => {
      const socketId = onlineUsers?.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("messageReactionUpdated", {
          messageId: message._id,
          conversationId: message.conversationId,
          reactions: message.reactions
        });
      }
    });

    return res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};