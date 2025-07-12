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
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['private', 'group'],
        default: 'private'
    },
    name: {
        type: String,
        trim: true
    },
    avatar: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Validation for private conversations
conversationSchema.pre('save', function (next) {
    if (this.type === 'private' && this.participants.length !== 2) {
        return next(new Error('Private conversation must have exactly 2 participants'));
    }
    next();
});

// Update last message
conversationSchema.methods.updateLastMessage = async function (messageId) {
    const Message = require('./Message');

    // Check if the message is not deleted
    const message = await Message.findById(messageId);
    if (message && !message.deleted.isDeleted) {
        this.lastMessage = messageId;
        this.lastMessageAt = new Date();
        return await this.save();
    }

    // If message is deleted, find the most recent non-deleted message
    const lastValidMessage = await Message.findOne({
        conversation: this._id,
        'deleted.isDeleted': false
    }).sort({ createdAt: -1 });

    if (lastValidMessage) {
        this.lastMessage = lastValidMessage._id;
        this.lastMessageAt = lastValidMessage.createdAt;
    } else {
        this.lastMessage = null;
        this.lastMessageAt = this.createdAt;
    }

    return await this.save();
};

// Increment unread count
conversationSchema.methods.incrementUnreadCount = async function (userId) {
    const participant = this.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
        participant.unreadCount += 1;
        return await this.save();
    }
};

// Reset unread count
conversationSchema.methods.resetUnreadCount = async function (userId) {
    const participant = this.participants.find(p => p.user.toString() === userId.toString());
    if (participant) {
        participant.unreadCount = 0;
        participant.lastSeen = new Date();
        return await this.save();
    }
};

// Check if user is participant
conversationSchema.methods.isParticipant = function (userId) {
    return this.participants.some(p => p.user.toString() === userId.toString());
};

// Indexes
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
