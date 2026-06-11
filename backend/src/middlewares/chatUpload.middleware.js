const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// تفعيل إعدادات كلودنيري (بتستخدم نفس الـ config)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // تحديد نوع الـ resource تلقائياً (فيديو، صورة، ملف خام كالـ pdf)
    let resourceType = 'auto'; 
    
    return {
      folder: 'chat_media', // الفولدر الأساسي لمرفقات الشات
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mkv', 'mp3', 'wav', 'm4a', 'pdf', 'docx', 'zip'], // دعم كل الصيغ المطلوبة
      public_id: `media-${Date.now()}-${Math.round(Math.random() * 1E4)}` // اسم فريد للملف
    };
  },
});

// تحديد حد أقصى لحجم الملف (مثلاً 50 ميجا للفيديوهات والملفات الكبيرة)
const chatUpload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } 
});

module.exports = chatUpload;