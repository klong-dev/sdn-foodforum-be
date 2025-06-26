const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lastSeen: {
            type: Date,
            default: Date.now
        },
        unreadCount: {
            type: Number,
            default: 0
        }
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure exactly two participants
conversationSchema.pre('save', function (next) {
    if (this.participants.length !== 2) {
        return next(new Error('Conversation must have exactly two participants'));
    }
    next();
});

// Update last message time when new message is added
conversationSchema.methods.updateLastMessage = async function (messageId) {
    this.lastMessage = messageId;
    this.lastMessageTime = new Date();
    await this.save();
};

// Increment unread count for a participant
conversationSchema.methods.incrementUnreadCount = async function (userId) {
    const participant = this.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
        participant.unreadCount += 1;
        await this.save();
    }
};

// Reset unread count for a participant
conversationSchema.methods.resetUnreadCount = async function (userId) {
    const participant = this.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
        participant.unreadCount = 0;
        participant.lastSeen = new Date();
        await this.save();
    }
};

// Indexes for faster queries
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ lastMessageTime: -1 });
conversationSchema.index({ isActive: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;