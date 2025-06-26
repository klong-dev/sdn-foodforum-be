const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

const setupSocketIO = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    // Authentication middleware
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

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // Store online users
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log('User connected:', socket.user._id);

        // Add user to online users
        onlineUsers.set(socket.user._id.toString(), socket.id);

        // Join user's conversations
        socket.on('join_conversations', async () => {
            const conversations = await Conversation.find({
                'participants.user': socket.user._id
            });

            conversations.forEach(conversation => {
                socket.join(conversation._id.toString());
            });
        });

        // Handle new message
        socket.on('send_message', async (data) => {
            try {
                const { conversationId, content, type = 'text', attachments = [], replyTo } = data;

                const message = new Message({
                    conversation: conversationId,
                    sender: socket.user._id,
                    content,
                    type,
                    attachments,
                    replyTo
                });

                await message.save();

                // Update conversation's last message
                await Conversation.findByIdAndUpdate(conversationId, {
                    lastMessage: message._id,
                    lastMessageTime: new Date()
                });

                // Emit to all participants in the conversation
                io.to(conversationId).emit('new_message', message);

                // Send push notification to offline participants
                const conversation = await Conversation.findById(conversationId)
                    .populate('participants.user');

                conversation.participants.forEach(participant => {
                    if (participant.user._id.toString() !== socket.user._id.toString()) {
                        const recipientSocketId = onlineUsers.get(participant.user._id.toString());
                        if (!recipientSocketId) {
                            // TODO: Implement push notification service
                            console.log('Send push notification to:', participant.user._id);
                        }
                    }
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Handle message edit
        socket.on('edit_message', async (data) => {
            try {
                const { messageId, newContent } = data;
                const message = await Message.findById(messageId);

                if (!message) {
                    throw new Error('Message not found');
                }

                if (message.sender.toString() !== socket.user._id.toString()) {
                    throw new Error('Not authorized to edit this message');
                }

                message.edit(newContent);
                await message.save();

                io.to(message.conversation.toString()).emit('message_edited', message);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Handle message deletion
        socket.on('delete_message', async (data) => {
            try {
                const { messageId } = data;
                const message = await Message.findById(messageId);

                if (!message) {
                    throw new Error('Message not found');
                }

                if (message.sender.toString() !== socket.user._id.toString()) {
                    throw new Error('Not authorized to delete this message');
                }

                message.softDelete(socket.user._id);
                await message.save();

                io.to(message.conversation.toString()).emit('message_deleted', message);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Handle read receipts
        socket.on('mark_as_read', async (data) => {
            try {
                const { messageId } = data;
                const message = await Message.findById(messageId);

                if (!message) {
                    throw new Error('Message not found');
                }

                const readBy = message.readBy.find(r => r.user.toString() === socket.user._id.toString());
                if (!readBy) {
                    message.readBy.push({
                        user: socket.user._id,
                        readAt: new Date()
                    });
                    await message.save();
                }

                io.to(message.conversation.toString()).emit('message_read', {
                    messageId,
                    userId: socket.user._id
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Handle typing status
        socket.on('typing', (data) => {
            const { conversationId, isTyping } = data;
            socket.to(conversationId).emit('user_typing', {
                userId: socket.user._id,
                isTyping
            });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.user._id);
            onlineUsers.delete(socket.user._id.toString());
        });
    });

    return io;
};

module.exports = setupSocketIO; 