const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const {protect} = require('./auth.middleware');
const upload = require('../../middlewares/upload.middleware')

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

router.put('/update-profile',protect,upload.single('avatar'), authController.updateProfile);

module.exports = router;