const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/users.model');

// Create a new conversation
exports.createConversation = async (req, res) => {
    try {
        const { participantId } = req.body;
        const firstMessage = req.body.firstMessage || '';
        const currentUserId = req.user.id;

        // Kiểm tra chỉ cho phép chat với bạn bè
        const user = await User.findById(currentUserId);
        if (!user.friends.map(id => id.toString()).includes(participantId)) {
            return res.status(403).json({ error: 'Chỉ có thể chat với bạn bè.' });
        }
        // Đảm bảo ngược lại cũng đúng (participant đã kết bạn với user)
        const participant = await User.findById(participantId);
        if (!participant.friends.map(id => id.toString()).includes(currentUserId)) {
            return res.status(403).json({ error: 'Chỉ có thể chat với bạn bè.' });
        }

        // Extract content from firstMessage if it's an object
        let messageContent = '';
        let messageType = 'text';

        if (firstMessage) {
            if (typeof firstMessage === 'object' && firstMessage.content) {
                messageContent = firstMessage.content;
                messageType = firstMessage.type || 'text';
            } else if (typeof firstMessage === 'string') {
                messageContent = firstMessage;
            }
        }

        // Check if any conversation already exists (active or archived, but not deleted)
        const existingConversation = await Conversation.findOne({
            'participants.user': { $all: [currentUserId, participantId] },
            'deleted.isDeleted': false
        });

        if (existingConversation) {
            // Return existing conversation (whether active or archived)
            return res.status(200).json(existingConversation);
        }

        // Create new conversation only when no conversation exists or previous was deleted
        const conversation = new Conversation({
            participants: [
                { user: currentUserId },
                { user: participantId }
            ],
        });

        // Create the first message if provided
        if (messageContent && messageContent.trim()) {
            const message = new Message({
                sender: currentUserId,
                content: messageContent.trim(),
                conversation: conversation._id,
                type: messageType
            });
            await message.save();
            conversation.lastMessage = message._id;
            conversation.lastMessageAt = message.createdAt;
        }

        await conversation.save();
        await conversation.populate({
            path: 'participants.user',
            select: 'username email avatar role isOnline lastSeen'
        });

        // Since this is a new conversation, there's no lastMessage yet
        // But we'll populate it anyway in case it gets set later
        if (conversation.lastMessage) {
            await conversation.populate({
                path: 'lastMessage',
                select: 'sender content type attachments createdAt edited deleted readBy replyTo',
                populate: {
                    path: 'sender',
                    select: 'username email avatar role isOnline lastSeen'
                }
            });
        }

        console.log('New conversation created:', conversation);

        res.status(201).json(conversation);
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get all conversations for current user
exports.getUserConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const conversations = await Conversation.find({
            'participants.user': userId,
            isActive: true,
            'deleted.isDeleted': false
        })
            .sort({ lastMessageAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate({
                path: 'participants.user',
                select: 'username email avatar role isOnline lastSeen'
            })
            .populate({
                path: 'lastMessage',
                select: 'sender content type attachments createdAt edited deleted readBy replyTo',
                populate: {
                    path: 'sender',
                    select: 'username email avatar role isOnline lastSeen'
                }
            })
            .lean(); // Use lean() for better performance and to avoid mongoose quirks

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a specific conversation
exports.getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId)
            .populate({
                path: 'participants.user',
                select: 'username email avatar role isOnline lastSeen'
            })
            .populate({
                path: 'lastMessage',
                select: 'sender content type attachments createdAt edited deleted readBy replyTo',
                populate: {
                    path: 'sender',
                    select: 'username email avatar role isOnline lastSeen'
                }
            })
            .lean();

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user is a participant
        if (!conversation.participants.some(p => p.user._id.toString() === userId.toString())) {
            return res.status(403).json({ error: 'Not authorized to view this conversation' });
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Archive a conversation (can be restored)
exports.archiveConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user is a participant
        if (!conversation.participants.some(p => p.user.toString() === userId.toString())) {
            return res.status(403).json({ error: 'Not authorized to archive this conversation' });
        }

        conversation.isActive = false;
        await conversation.save();

        console.log(`📦 Conversation ${conversationId} archived by user ${userId}`);

        res.json({
            success: true,
            message: 'Conversation archived successfully'
        });
    } catch (error) {
        console.error('Error archiving conversation:', error);
        res.status(500).json({ error: error.message });
    }
};

// Restore archived conversation
exports.restoreConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user.id;

        // Find archived conversation (isActive: false but not deleted)
        const conversation = await Conversation.findOne({
            _id: conversationId,
            'participants.user': currentUserId,
            isActive: false,
            'deleted.isDeleted': false
        });

        if (!conversation) {
            return res.status(404).json({
                error: 'Archived conversation not found or you do not have permission to restore it'
            });
        }

        // Restore the conversation
        conversation.isActive = true;
        await conversation.save();

        // Populate the restored conversation
        await conversation.populate({
            path: 'participants.user',
            select: 'username email avatar role isOnline lastSeen'
        });

        if (conversation.lastMessage) {
            await conversation.populate({
                path: 'lastMessage',
                select: 'sender content type attachments createdAt edited deleted readBy replyTo',
                populate: {
                    path: 'sender',
                    select: 'username email avatar role'
                }
            });
        }

        console.log(`♻️ Conversation ${conversationId} restored from archive by user ${currentUserId}`);

        res.status(200).json({
            success: true,
            message: 'Conversation restored successfully',
            conversation
        });

    } catch (error) {
        console.error('Error restoring conversation:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get archived conversations (isActive: false but not deleted)
exports.getArchivedConversations = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const archivedConversations = await Conversation.find({
            'participants.user': currentUserId,
            isActive: false,
            'deleted.isDeleted': false
        })
            .populate({
                path: 'participants.user',
                select: 'username email avatar role isOnline lastSeen'
            })
            .populate({
                path: 'lastMessage',
                select: 'sender content type attachments createdAt edited deleted readBy replyTo',
                populate: {
                    path: 'sender',
                    select: 'username email avatar role'
                }
            })
            .sort({ updatedAt: -1 });

        res.status(200).json(archivedConversations);

    } catch (error) {
        console.error('Error fetching archived conversations:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get conversation unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            'participants.user': userId,
            isActive: true
        });

        const totalUnread = conversations.reduce((sum, conv) => {
            const participant = conv.participants.find(p => p.user.toString() === userId.toString());
            return sum + (participant ? participant.unreadCount : 0);
        }, 0);

        res.json({ unreadCount: totalUnread });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete conversation (permanent, cannot be restored)
exports.deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user.id;

        // Find conversation and verify user is participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            'participants.user': currentUserId,
            'deleted.isDeleted': false
        });

        if (!conversation) {
            return res.status(404).json({
                error: 'Conversation not found or you do not have permission to delete it'
            });
        }

        // Permanently soft delete the conversation (cannot be restored)
        await conversation.softDelete(currentUserId);

        console.log(`🗑️ Conversation ${conversationId} permanently deleted by user ${currentUserId}`);

        res.status(200).json({
            success: true,
            message: 'Conversation deleted permanently'
        });

    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: error.message });
    }
};
