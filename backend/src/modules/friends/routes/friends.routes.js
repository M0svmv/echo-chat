const express = require('express');
const router = express.Router();

const friendsController = require('../controllers/friends.controller');
const { protect } = require("../../auth/auth.middleware");

// --- طلبات الصداقة (Friend Requests) ---
router.post('/request', protect, friendsController.sendFriendRequest);
router.get('/requests', protect, friendsController.getFriendRequests);
router.get('/requests/sent', protect, friendsController.getMySentRequests);
router.post('/request/respond/:requestId', protect, friendsController.respondToFriendRequest);
router.delete('/request/delete/:requestId', protect, friendsController.deleteFriendRequest);

// --- البحث عن مستخدمين متاحين ---
router.get('/search', protect, friendsController.getAvailableUsers);

// --- إدارة الأصدقاء (Friends Management) ---
router.get('/all', protect, friendsController.getFriends); // يجيب كل الأصدقاء المقبولين
router.delete('/remove', protect, friendsController.removeFriend); // إنهاء الصداقة مع مستخدم

// --- التفضيلات الشخصية (Close Friends & Blocks) ---
router.get('/close-friends', protect, friendsController.getCloseFriends); // يجيب لستة الكلوز فريندز
router.get('/blocked', protect, friendsController.getBlockedUsers); // يجيب لستة البلوك
router.post('/preference', protect, friendsController.makePreference); // عمل بلوك أو إضافة للـ close_friend

module.exports = router;