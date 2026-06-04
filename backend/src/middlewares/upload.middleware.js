const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 1. إعدادات حساب Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. إعدادات التخزين (فين الصورة هتنزل في Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat_app_avatars', // اسم الفولدر اللي هيتكريه في السيرفر
    allowed_formats: ['jpg', 'jpeg', 'png'], // الصيغ المسموح بيها بس
    transformation: [{ width: 200, height: 200, crop: 'limit' }] // تصغير حجم الصورة تلقائياً لتوفير المساحة
  },
});

const upload = multer({ storage: storage });

module.exports = upload;