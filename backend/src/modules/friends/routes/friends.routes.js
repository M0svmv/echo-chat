const express = require('express');
const router = express.Router();

const friendsController = require('../controllers/friends.controller');
const {protect} = require("../../auth/auth.middleware");


router.post('/request', protect, friendsController.sendFriendRequest);
router.get('/requests', protect, friendsController.getFriendRequests);
router.get('/search', protect, friendsController.getAvailableUsers);
router.get('/requests/sent', protect, friendsController.getMySentRequests);
router.post('/request/respond/:requestId', protect, friendsController.respondToFriendRequest);
router.delete('/request/delete/:requestId', protect, friendsController.deleteFriendRequest);

module.exports = router;
