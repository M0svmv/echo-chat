const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path'); // عشان نتعامل مع الامتدادات بسهولة

// تفعيل إعدادات كلودنيري
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let resourceType = 'auto'; 
    
    // 1. استخراج اسم الملف الأصلي بدون الامتداد (عشان لو امتداده .png أو .mp3 مثلاً)
    const ext = path.extname(file.originalname); // بيجيب مثلاً ".png"
    const originalNameWithoutExt = path.basename(file.originalname, ext); // بيجيب اسم الملف صافي
    
    // 2. تنظيف الاسم: استبدال أي مسافات أو رموز غريبة بشرطة (-) عشان الـ URL يبقا سليم وعصري
    const cleanedName = originalNameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, '-') // استبدال أي رمز مش حرف أو رقم بشرطة
      .replace(/-+/g, '-')           // منع تكرار الشرط ورا بعضها
      .toLowerCase();                // خليه حروف صغيرة لسلامة الروابط

    // 3. دمج الاسم الأصلي المنظف مع تايمستامب مميز لحمايته من التكرار على السيرفر
    const finalPublicId = `${cleanedName}-${Date.now()}`;

    return {
      folder: 'chat_media', 
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mkv', 'mp3', 'wav', 'm4a', 'pdf', 'docx', 'zip', 'doc'], 
      public_id: finalPublicId // 🔥 الاسم الجديد المبني على اسم الملف الأصلي!
    };
  },
});

// تحديد حد أقصى لحجم الملف (50 ميجا)
const chatUpload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } 
});

module.exports = chatUpload;