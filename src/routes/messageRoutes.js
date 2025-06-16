const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(auth);

// Message routes
router.route('/')
    .post(messageController.sendMessage);

router.route('/conversation/:conversationId')
    .get(messageController.getMessages);

router.route('/:messageId')
    .put(messageController.editMessage)
    .delete(messageController.deleteMessage);

module.exports = router; 