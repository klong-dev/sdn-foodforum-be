const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const auth = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(auth);

// Conversation routes
router.route('/')
    .get(conversationController.getUserConversations)
    .post(conversationController.createConversation);

router.route('/:conversationId')
    .get(conversationController.getConversation)
    .put(conversationController.archiveConversation);

router.route('/unread-total')
    .get(conversationController.getUnreadCount);

module.exports = router; 