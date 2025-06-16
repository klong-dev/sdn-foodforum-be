const Message = require('../models/message');
const Conversation = require('../models/conversation');

// Send a new message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, content, type = 'text', attachments = [], replyTo } = req.body;
        const senderId = req.user._id;  // Extracted from JWT by authMiddleware

        // Create new message
        const message = new Message({
            conversation: conversationId,
            sender: senderId,
            content,
            type,
            attachments,
            replyTo
        });

        await message.save();

        // Update conversation's last message
        const conversation = await Conversation.findById(conversationId);
        await conversation.updateLastMessage(message._id);

        // Increment unread count for other participant
        const otherParticipant = conversation.participants.find(
            p => p.user.toString() !== senderId.toString()
        );
        if (otherParticipant) {
            await conversation.incrementUnreadCount(otherParticipant.user);
        }

        // Populate sender info before sending response
        await message.populate('sender', 'username profilePicture');

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user._id;

        // Verify user is part of the conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (!conversation.participants.some(p => p.user.toString() === userId.toString())) {
            return res.status(403).json({ error: 'Not authorized to view these messages' });
        }

        // Get messages with pagination
        const messages = await Message.find({
            conversation: conversationId,
            'deleted.isDeleted': false
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('sender', 'username profilePicture')
            .populate('replyTo');

        // Mark messages as read
        for (const message of messages) {
            await message.markAsRead(userId);
        }

        // Reset unread count for this user
        await conversation.resetUnreadCount(userId);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Edit a message
exports.editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check if user is the sender
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Not authorized to edit this message' });
        }

        // Check if message can still be edited
        if (!message.canEdit()) {
            return res.status(400).json({ error: 'Message can no longer be edited' });
        }

        message.edit(content);
        await message.save();

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check if user is the sender
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this message' });
        }

        message.softDelete(userId);
        await message.save();

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; 