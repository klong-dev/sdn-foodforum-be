const Message = require('../models/message');
const Conversation = require('../models/conversation');

const socketService = (io) => {
    // Store online users
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle user connection
        socket.on('user:connect', (userId) => {
            onlineUsers.set(userId, socket.id);
            socket.join(userId);
            console.log(`User ${userId} connected with socket ${socket.id}`);
        });

        // Handle joining a conversation
        socket.on('conversation:join', (conversationId) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
        });

        // Handle new message
        socket.on('message:send', async (data) => {
            try {
                const { conversationId, content, type = 'text', attachments = [], replyTo } = data;
                const senderId = data.senderId;

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

                // Populate sender info
                await message.populate('sender', 'username profilePicture');

                // Emit to all users in the conversation
                io.to(conversationId).emit('message:new', message);

                // Emit unread count update to recipient
                if (otherParticipant) {
                    io.to(otherParticipant.user.toString()).emit('conversation:unread', {
                        conversationId,
                        unreadCount: otherParticipant.unreadCount
                    });
                }
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        // Handle message read
        socket.on('message:read', async (data) => {
            try {
                const { conversationId, messageIds } = data;
                const userId = data.userId;

                // Mark messages as read
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $addToSet: { readBy: { user: userId, readAt: new Date() } } }
                );

                // Reset unread count
                const conversation = await Conversation.findById(conversationId);
                if (conversation) {
                    await conversation.resetUnreadCount(userId);

                    // Notify sender that messages were read
                    const otherParticipant = conversation.participants.find(
                        p => p.user.toString() !== userId.toString()
                    );
                    if (otherParticipant) {
                        io.to(otherParticipant.user.toString()).emit('message:read', {
                            conversationId,
                            readBy: userId
                        });
                    }
                }
            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Error marking messages as read' });
            }
        });

        // Handle typing status
        socket.on('typing:start', (data) => {
            const { conversationId, userId } = data;
            socket.to(conversationId).emit('typing:start', { userId });
        });

        socket.on('typing:stop', (data) => {
            const { conversationId, userId } = data;
            socket.to(conversationId).emit('typing:stop', { userId });
        });

        // Handle user disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Remove user from online users
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    break;
                }
            }
        });
    });

    return {
        // Helper function to get socket ID for a user
        getUserSocket: (userId) => onlineUsers.get(userId),

        // Helper function to check if user is online
        isUserOnline: (userId) => onlineUsers.has(userId),

        // Helper function to emit to specific user
        emitToUser: (userId, event, data) => {
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                io.to(socketId).emit(event, data);
            }
        }
    };
};

module.exports = socketService; 