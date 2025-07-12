const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const auth = require('../middlewares/auth.middleware');

// Apply auth middleware to all routes
router.use(auth.verifyToken);

// Conversation routes
router.route('/')
    .get(conversationController.getUserConversations)
    .post(conversationController.createConversation);


router.route('/unread-total')
    .get(conversationController.getUnreadCount);

router.route('/:conversationId')
    .get(conversationController.getConversation)
    .put(conversationController.archiveConversation);


module.exports = router; 