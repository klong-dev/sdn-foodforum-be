const express = require('express');
const router = express.Router();
const AIController = require('../controllers/ai');
const authMiddleware = require('../middlewares/auth.middleware');

// Route xử lý chat với AI - yêu cầu người dùng đăng nhập
router.post('/chat', authMiddleware.verifyToken, AIController.chat);

module.exports = router;
