const jwt = require('jsonwebtoken');
const User = require('../models/users.model');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

const socketService = (io) => {
    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`🔌 User ${socket.user.username} connected (${socket.id})`);

        try {
            // Set user online
            await socket.user.setOnline(socket.id);

            // Join user to their personal room
            socket.join(socket.userId);

            // Emit online status to all users
            socket.broadcast.emit('user:online', {
                userId: socket.userId,
                username: socket.user.username,
                avatar: socket.user.avatar
            });

        } catch (error) {
            console.error('Error during connection setup:', error);
        }

        // Join conversation room
        socket.on('conversation:join', async (data) => {
            try {

                const { conversationId } = data;

                // Verify conversation exists and is valid (not deleted)
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId,
                    'deleted.isDeleted': false
                }).populate('participants.user', 'username email avatar role isOnline lastSeen');

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found or has been deleted' });
                    return;
                }

                socket.join(conversationId);
                socket.currentConversation = conversationId;

                // Mark conversation as read
                await conversation.resetUnreadCount(socket.userId);

                console.log(`📱 ${socket.user.username} joined conversation ${conversationId}`);

                socket.emit('conversation:joined', { conversationId });

            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: 'Error joining conversation' });
            }
        });

        // Leave conversation room
        socket.on('conversation:leave', (data) => {
            const { conversationId } = data;
            socket.leave(conversationId);
            socket.currentConversation = null;
            console.log(`📱 ${socket.user.username} left conversation ${conversationId}`);
        });

        // Send message via socket
        socket.on('message:send', async (data, callback) => {
            try {
                const { conversationId, content, type = 'text', replyTo, tempId, attachments } = data;

                if (!conversationId || !content?.trim()) {
                    const error = 'Invalid message data';
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }                // Verify conversation exists and is valid (not deleted)
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId,
                    'deleted.isDeleted': false
                }).populate('participants.user', 'username email avatar role isOnline lastSeen');

                if (!conversation) {
                    const error = 'Conversation not found or has been deleted';
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                // If conversation is archived, reactivate it when sending message
                if (!conversation.isActive) {
                    conversation.isActive = true;
                    await conversation.save();
                    console.log(`📱 Conversation ${conversationId} reactivated by sending message from user ${socket.userId}`);

                    // Notify all participants about reactivation
                    const participants = conversation.participants.map(p => p.user.toString());
                    participants.forEach(participantId => {
                        io.to(participantId).emit('conversation:reactivated', {
                            conversationId,
                            reactivatedBy: socket.userId,
                            reactivatedAt: new Date()
                        });
                    });
                }

                // Create message
                const message = new Message({
                    conversation: conversationId,
                    sender: socket.userId,
                    content: content.trim(),
                    type,
                    replyTo,
                    attachments: attachments || [],
                });

                await message.save();

                // Update conversation
                await conversation.updateLastMessage(message._id);

                // Increment unread count for other participants
                const otherParticipants = conversation.participants.filter(
                    p => p.user.toString() !== socket.userId
                );

                // Update unread count for all other participants in one operation
                if (otherParticipants.length > 0) {
                    for (const participant of otherParticipants) {
                        const participantData = conversation.participants.find(
                            p => p.user.toString() === participant.user.toString()
                        );
                        if (participantData) {
                            participantData.unreadCount += 1;
                        }
                    }
                    await conversation.save();
                }

                // Populate message
                await message.populate('sender', 'username email avatar role _id');
                if (replyTo) {
                    await message.populate('replyTo', 'content sender');
                    await message.populate('replyTo.sender', 'username avatar _id');
                }

                // Add tempId to the message for client-side deduplication
                const messageWithTempId = {
                    ...message.toObject(),
                    tempId
                };

                // Send acknowledgment to sender
                if (callback) {
                    callback({
                        success: true,
                        message: messageWithTempId
                    });
                }

                // Emit to conversation room (this will reach all participants including sender)
                io.to(conversationId).emit('message:new', messageWithTempId);

                // Emit unread count update to other participants
                for (const participant of otherParticipants) {
                    io.to(participant.user.toString()).emit('conversation:unread', {
                        conversationId,
                        unreadCount: participant.unreadCount + 1
                    });
                }

                console.log(`💬 Message sent in conversation ${conversationId}${tempId ? ` (tempId: ${tempId})` : ''}`);

            } catch (error) {
                console.error('Error sending message:', error);
                const errorMessage = 'Error sending message';
                if (callback) callback({ success: false, error: errorMessage });
                else socket.emit('error', { message: errorMessage });
            }
        });

        // Edit message
        socket.on('message:edit', async (data, callback) => {
            try {
                const { messageId, content } = data;

                const message = await Message.findOne({
                    _id: messageId,
                    sender: socket.userId,
                    'deleted.isDeleted': false
                });

                if (!message) {
                    const error = 'Message not found';
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                if (!message.canEdit()) {
                    const error = 'Message can no longer be edited';
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                message.editMessage(content);
                await message.save();

                await message.populate('sender', 'username email avatar role _id');
                if (message.replyTo) {
                    await message.populate('replyTo', 'content sender');
                    await message.populate('replyTo.sender', 'username avatar _id');
                }

                // Send acknowledgment to sender
                if (callback) {
                    callback({
                        success: true,
                        message: message
                    });
                }

                // Emit to conversation room
                io.to(message.conversation.toString()).emit('message:edited', message);

                console.log(`✏️ Message ${messageId} edited`);

            } catch (error) {
                console.error('Error editing message:', error);
                const errorMessage = 'Error editing message';
                if (callback) callback({ success: false, error: errorMessage });
                else socket.emit('error', { message: errorMessage });
            }
        });

        // Delete message
        socket.on('message:delete', async (data) => {
            try {
                const { messageId } = data;

                const message = await Message.findOne({
                    _id: messageId,
                    sender: socket.userId
                });

                if (!message) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }

                message.softDelete(socket.userId);
                await message.save();

                // Emit to conversation room
                io.to(message.conversation.toString()).emit('message:deleted', {
                    messageId,
                    deletedBy: socket.userId
                });

                console.log(`🗑️ Message ${messageId} deleted`);

            } catch (error) {
                console.error('Error deleting message:', error);
                socket.emit('error', { message: 'Error deleting message' });
            }
        });

        // Typing indicators
        socket.on('typing:start', (data) => {
            const { conversationId } = data;
            socket.to(conversationId).emit('typing:start', {
                userId: socket.userId,
                username: socket.user.username
            });
        });

        socket.on('typing:stop', (data) => {
            const { conversationId } = data;
            socket.to(conversationId).emit('typing:stop', {
                userId: socket.userId,
                username: socket.user.username
            });
        });

        // Mark messages as read
        socket.on('messages:read', async (data) => {
            try {
                const { conversationId, messageIds } = data;

                // Verify conversation exists and is valid (not deleted)
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId,
                    'deleted.isDeleted': false
                }).populate('participants.user', 'username email avatar role isOnline lastSeen');

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found or has been deleted' });
                    return;
                }

                // Mark messages as read
                await Message.updateMany(
                    {
                        _id: { $in: messageIds },
                        conversation: conversationId
                    },
                    {
                        $addToSet: {
                            readBy: {
                                user: socket.userId,
                                readAt: new Date()
                            }
                        }
                    }
                );

                // Reset unread count
                await conversation.resetUnreadCount(socket.userId);

                // Notify other participants
                socket.to(conversationId).emit('messages:read', {
                    userId: socket.userId,
                    messageIds,
                    readAt: new Date()
                });

            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Error marking messages as read' });
            }
        });

        // Add reaction
        socket.on('message:react', async (data) => {
            try {
                const { messageId, emoji } = data;

                const message = await Message.findOne({
                    _id: messageId,
                    'deleted.isDeleted': false
                }).populate('conversation');

                if (!message) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }

                // Check if user is participant
                if (!message.conversation.isParticipant(socket.userId)) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }

                await message.addReaction(socket.userId, emoji);

                // Emit to conversation room
                io.to(message.conversation._id.toString()).emit('message:reaction', {
                    messageId,
                    userId: socket.userId,
                    emoji,
                    reactions: message.reactions
                });

            } catch (error) {
                console.error('Error adding reaction:', error);
                socket.emit('error', { message: 'Error adding reaction' });
            }
        });

        // Mark conversation as read
        socket.on('conversation:read', async (data) => {
            try {
                const { conversationId } = data;

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId,
                    'deleted.isDeleted': false
                }).populate('participants.user', 'username email avatar role isOnline lastSeen');

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found or has been deleted' });
                    return;
                }

                await conversation.resetUnreadCount(socket.userId);

                // Emit to user's other sessions to update sidebar
                socket.to(socket.userId).emit('conversation:read', { conversationId });

                console.log(`📱 ${socket.user.username} marked conversation ${conversationId} as read`);

            } catch (error) {
                console.error('Error marking conversation as read:', error);
                socket.emit('error', { message: 'Error marking conversation as read' });
            }
        });

        // Get all conversations for user
        socket.on('conversations:get', async (data, callback) => {
            try {
                const { page = 1, limit = 20 } = data || {};

                const conversations = await Conversation.find({
                    'participants.user': socket.userId,
                    isActive: true,
                    'deleted.isDeleted': false
                })
                    .sort({ lastMessageAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(parseInt(limit))
                    .populate('participants.user', 'username email avatar role isOnline lastSeen')
                    .populate({
                        path: 'lastMessage',
                        populate: {
                            path: 'sender',
                            select: 'username avatar'
                        }
                    });

                if (callback) {
                    callback({
                        success: true,
                        conversations,
                        total: conversations.length
                    });
                }

                console.log(`📱 ${socket.user.username} retrieved ${conversations.length} conversations`);

            } catch (error) {
                console.error('Error getting conversations:', error);
                const errorMessage = 'Error retrieving conversations';
                if (callback) callback({ success: false, error: errorMessage });
                else socket.emit('error', { message: errorMessage });
            }
        });

        // Delete conversation via socket (permanent)
        socket.on('conversation:delete', async (data, callback) => {
            try {
                if (!data) {
                    const error = 'No data provided';
                    console.error('❌ Conversation delete error:', error);
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                const { conversationId } = data;

                if (!conversationId) {
                    const error = 'Conversation ID is required';
                    console.error('❌ Conversation delete error:', error);
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                // Find conversation and verify user is participant
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId,
                    'deleted.isDeleted': false
                });

                if (!conversation) {
                    const error = 'Conversation not found or you do not have permission to delete it';
                    console.error('❌ Conversation delete error:', error);
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                // Permanently soft delete the conversation
                await conversation.softDelete(socket.userId);

                console.log(`🗑️ Conversation ${conversationId} permanently deleted by user ${socket.userId}`);

                // Notify all participants about the deletion
                const participants = conversation.participants.map(p => p.user.toString());
                participants.forEach(participantId => {
                    io.to(participantId).emit('conversation:deleted', {
                        conversationId,
                        deletedBy: socket.userId,
                        deletedAt: new Date()
                    });
                });

                const response = {
                    success: true,
                    message: 'Conversation deleted permanently',
                    conversationId
                };

                if (callback) callback(response);

            } catch (error) {
                console.error('❌ Error deleting conversation:', error);
                const errorMessage = error.message || 'Error deleting conversation';
                if (callback) callback({ success: false, error: errorMessage });
                else socket.emit('error', { message: errorMessage });
            }
        });

        // Archive conversation via socket
        socket.on('conversation:archive', async (data, callback) => {
            try {
                if (!data) {
                    const error = 'No data provided';
                    console.error('❌ Conversation archive error:', error);
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                const { conversationId } = data;

                if (!conversationId) {
                    const error = 'Conversation ID is required';
                    console.error('❌ Conversation archive error:', error);
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                // Find conversation and verify user is participant
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId,
                    isActive: true
                });

                if (!conversation) {
                    const error = 'Conversation not found or you do not have permission to archive it';
                    console.error('❌ Conversation archive error:', error);
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                // Archive the conversation
                conversation.isActive = false;
                await conversation.save();

                console.log(`📦 Conversation ${conversationId} archived by user ${socket.userId}`);

                // Notify all participants about the archiving
                const participants = conversation.participants.map(p => p.user.toString());
                participants.forEach(participantId => {
                    io.to(participantId).emit('conversation:archived', {
                        conversationId,
                        archivedBy: socket.userId,
                        archivedAt: new Date()
                    });
                });

                const response = {
                    success: true,
                    message: 'Conversation archived successfully',
                    conversationId
                };

                if (callback) callback(response);

            } catch (error) {
                console.error('❌ Error archiving conversation:', error);
                const errorMessage = error.message || 'Error archiving conversation';
                if (callback) callback({ success: false, error: errorMessage });
                else socket.emit('error', { message: errorMessage });
            }
        });

        // Restore archived conversation via socket
        socket.on('conversation:restore', async (data, callback) => {
            try {
                if (!data) {
                    const error = 'No data provided';
                    console.error('❌ Conversation restore error:', error);
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                const { conversationId } = data;

                if (!conversationId) {
                    const error = 'Conversation ID is required';
                    console.error('❌ Conversation restore error:', error);
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                // Find archived conversation and verify user is participant
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId,
                    isActive: false,
                    'deleted.isDeleted': false
                });

                if (!conversation) {
                    const error = 'Archived conversation not found or you do not have permission to restore it';
                    console.error('❌ Conversation restore error:', error);
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
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

                console.log(`♻️ Conversation ${conversationId} restored from archive by user ${socket.userId}`);

                // Notify all participants about the restoration
                const participants = conversation.participants.map(p => p.user.toString());
                participants.forEach(participantId => {
                    io.to(participantId).emit('conversation:restored', {
                        conversation: conversation.toObject(),
                        restoredBy: socket.userId,
                        restoredAt: new Date()
                    });
                });

                const response = {
                    success: true,
                    message: 'Conversation restored successfully',
                    conversation: conversation.toObject()
                };

                if (callback) callback(response);

            } catch (error) {
                console.error('❌ Error restoring conversation:', error);
                const errorMessage = error.message || 'Error restoring conversation';
                if (callback) callback({ success: false, error: errorMessage });
                else socket.emit('error', { message: errorMessage });
            }
        });

        // Get archived conversations via socket
        socket.on('conversations:archived:get', async (data, callback) => {
            try {
                const archivedConversations = await Conversation.find({
                    'participants.user': socket.userId,
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

                console.log(`📋 Retrieved ${archivedConversations.length} archived conversations for user ${socket.userId}`);

                const response = {
                    success: true,
                    conversations: archivedConversations
                };

                if (callback) callback(response);

            } catch (error) {
                console.error('❌ Error getting archived conversations:', error);
                const errorMessage = error.message || 'Error getting archived conversations';
                if (callback) callback({ success: false, error: errorMessage });
                else socket.emit('error', { message: errorMessage });
            }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            try {
                console.log(`🔌 User ${socket.user.username} disconnected (${socket.id})`);

                // Set user offline
                await socket.user.setOffline();

                // Emit offline status
                socket.broadcast.emit('user:offline', {
                    userId: socket.userId,
                    username: socket.user.username,
                    lastSeen: new Date()
                });

            } catch (error) {
                console.error('Error during disconnection:', error);
            }
        });
    });

    return io;
};

module.exports = socketService;
