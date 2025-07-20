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

// Get archived conversations - must come before :conversationId to avoid conflict
router.route('/archived/list')
    .get(conversationController.getArchivedConversations);

router.route('/:conversationId')
    .get(conversationController.getConversation)
    .delete(conversationController.deleteConversation);

// Archive conversation (can be restored)
router.route('/:conversationId/archive')
    .patch(conversationController.archiveConversation);

// Restore archived conversation
router.route('/:conversationId/restore')
    .patch(conversationController.restoreConversation);


module.exports = router; 