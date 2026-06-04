const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// حماية: طباعة للتأكد من قراءة الـ Keys في الـ Terminal
console.log("Cloudinary Config Check:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME ? "Loaded ✅" : "Missing ❌",
  key: process.env.CLOUDINARY_API_KEY ? "Loaded ✅" : "Missing ❌"
});

// تفعيل إعدادات كلودنيري
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat_app_avatars',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 150, height: 150, crop: 'fill', gravity: 'face' }]
  },
});

const upload = multer({ storage: storage });

module.exports = upload;