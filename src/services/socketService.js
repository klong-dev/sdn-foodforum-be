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
            const user = await User.findById(decoded.userId);

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

                // Verify user is participant
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId
                });

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
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
                const { conversationId, content, type = 'text', replyTo, tempId } = data;

                if (!conversationId || !content?.trim()) {
                    const error = 'Invalid message data';
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                // Verify conversation
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId
                });

                if (!conversation) {
                    const error = 'Conversation not found';
                    if (callback) callback({ success: false, error });
                    else socket.emit('error', { message: error });
                    return;
                }

                // Create message
                const message = new Message({
                    conversation: conversationId,
                    sender: socket.userId,
                    content: content.trim(),
                    type,
                    replyTo
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
                await message.populate('sender', 'username avatar');
                if (replyTo) {
                    await message.populate('replyTo', 'content sender');
                    await message.populate('replyTo.sender', 'username');
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

                await message.populate('sender', 'username avatar');
                if (message.replyTo) {
                    await message.populate('replyTo', 'content sender');
                    await message.populate('replyTo.sender', 'username');
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

                // Verify conversation access
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': socket.userId
                });

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
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
                    'participants.user': socket.userId
                });

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
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
