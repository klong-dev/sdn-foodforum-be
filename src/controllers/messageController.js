const Message = require('../models/message');
const Conversation = require('../models/conversation');

// Send a new message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, content, type = 'text', attachments = [], replyTo } = req.body;
        const senderId = req.user.id;  // Extracted from JWT by authMiddleware

        // Verify conversation exists and is valid (not deleted)
        const conversation = await Conversation.findOne({
            _id: conversationId,
            'deleted.isDeleted': false
        });

        if (!conversation) {
            return res.status(404).json({
                error: 'Conversation not found or has been deleted'
            });
        }

        // Verify user is participant of the conversation
        if (!conversation.participants.some(p => p.user.toString() === senderId.toString())) {
            return res.status(403).json({
                error: 'Not authorized to send messages to this conversation'
            });
        }

        // If conversation is archived, reactivate it when sending message
        if (!conversation.isActive) {
            conversation.isActive = true;
            await conversation.save();
            console.log(`📱 Conversation ${conversationId} reactivated by sending message from user ${senderId}`);
        }

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
        await conversation.updateLastMessage(message._id);

        // Increment unread count for other participant
        const otherParticipant = conversation.participants.find(
            p => p.user.toString() !== senderId.toString()
        );
        if (otherParticipant) {
            await conversation.incrementUnreadCount(otherParticipant.user);
        }

        // Populate sender info before sending response
        await message.populate('sender', 'username email avatar role _id');
        if (message.replyTo) {
            await message.populate('replyTo', 'content sender');
            await message.populate('replyTo.sender', 'username avatar');
        }

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
        const userId = req.user.id;

        // Verify conversation exists and is valid (not deleted)
        const conversation = await Conversation.findOne({
            _id: conversationId,
            'deleted.isDeleted': false
        });

        if (!conversation) {
            return res.status(404).json({
                error: 'Conversation not found or has been deleted'
            });
        }

        // Verify user is participant of the conversation
        if (!conversation.participants.some(p => p.user.toString() === userId.toString())) {
            return res.status(403).json({
                error: 'Not authorized to view these messages'
            });
        }

        // Check if conversation is archived (optional warning)
        if (!conversation.isActive) {
            console.log(`⚠️ User ${userId} accessing messages from archived conversation ${conversationId}`);
        }

        // Get messages with pagination
        const messages = await Message.find({
            conversation: conversationId,
            'deleted.isDeleted': false
        })
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('sender', 'username email avatar role _id')
            .populate({
                path: 'replyTo',
                populate: {
                    path: 'sender',
                    select: 'username avatar _id'
                }
            });

        console.log('Fetched messages:', messages);

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
        const userId = req.user.id;

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
        const userId = req.user.id;

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


// Get replies to a specific message
exports.getRepliesToMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.id;

        // First, get the original message to verify permissions
        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Verify user is part of the conversation
        const conversation = await Conversation.findById(originalMessage.conversation);
        if (!conversation.participants.some(p => p.user.toString() === userId.toString())) {
            return res.status(403).json({ error: 'Not authorized to view these replies' });
        }

        // Get replies using the model's static method
        const replies = await Message.getRepliesToMessage(messageId, {
            limit: parseInt(limit),
            skip: (page - 1) * limit,
            populateSender: true
        });

        res.status(200).json(replies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; 