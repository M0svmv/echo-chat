const Message = require("../../../models/message.model");
const Conversation = require("../../../models/conversation.model");
const UserPreference = require("../../../models/userPreference.model");

exports.sendMessage = async (req, res) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    const senderId = req.user._id;
    const { conversationId, text } = req.body;

    if (!conversationId) return res.status(400).json({ message: "Conversation ID is required" });

    // === [هندسة المرفقات من الميدل وير] ===
    let fileUrl = "";
    let fileType = "text";

    if (req.file) {
      // الـ CloudinaryStorage بيبعت الرابط الجاهز في حقل الـ path تلقائياً
      fileUrl = req.file.path; 
      
      // تحديد الـ fileType بناءً على الـ mimetype للملف
      const mime = req.file.mimetype;
      if (mime.startsWith("image/")) fileType = "image";
      else if (mime.startsWith("video/")) fileType = "video";
      else if (mime.startsWith("audio/")) fileType = "audio"; // للريكوردات والملفات الصوتية
      else fileType = "file"; // للـ PDF والـ Zip وغيره
    }

    // شرط الأمان الجديد: لازم يكون فيه نص أو ملف مبعوت
    if (!text && !fileUrl) {
      return res.status(400).json({ message: "Cannot send an empty message" });
    }

    // جلب المحادثة من الداتا بيز
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
      fileType
    });

    // عمل populate لبيانات مرسل الرسالة عشان الفرونت إيند يقرأ الـ sender كـ object سليم
    const message = await newMessage.populate("sender", "firstName lastName username avatar");

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
      .populate("sender", "firstName lastName username");

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};