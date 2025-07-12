const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middlewares/auth.middleware');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

// Message routes
router.route('/')
    .post(messageController.sendMessage);

router.route('/:conversationId')
    .get(messageController.getMessages);

router.route('/:messageId')
    .put(messageController.editMessage)
    .delete(messageController.deleteMessage);

// Get replies to a specific message
router.route('/:messageId/replies')
    .get(messageController.getRepliesToMessage);

module.exports = router; 