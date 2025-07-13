const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/users.model');

// Create a new conversation
exports.createConversation = async (req, res) => {
    try {
        const { participantId } = req.body;
        const firstMessage = req.body.firstMessage || '';
        const currentUserId = req.user.id;

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

        // Check if conversation already exists
        const existingConversation = await Conversation.findOne({
            'participants.user': { $all: [currentUserId, participantId] },
            isActive: true
        });

        if (existingConversation) {
            return res.status(200).json(existingConversation);
        }


        // Create new conversation
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
            isActive: true
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

// Archive a conversation
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

        res.json({ message: 'Conversation archived successfully' });
    } catch (error) {
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
