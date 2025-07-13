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
    },
    // Soft delete fields
    deleted: {
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
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
    const Message = require('./message');

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

// Soft delete method - delete entire conversation
conversationSchema.methods.softDelete = async function (userId) {
    this.deleted.isDeleted = true;
    this.deleted.deletedAt = new Date();
    this.deleted.deletedBy = userId;
    this.isActive = false;
    return await this.save();
};

// Restore method - restore entire conversation
conversationSchema.methods.restore = async function () {
    this.deleted.isDeleted = false;
    this.deleted.deletedAt = null;
    this.deleted.deletedBy = null;
    this.isActive = true;
    return await this.save();
};

// Query helpers - only get non-deleted conversations by default
conversationSchema.pre(/^find/, function () {
    // Only apply filter if not explicitly including deleted
    if (!this.getOptions().includeDeleted) {
        this.where({ 'deleted.isDeleted': { $ne: true } });
    }
});

// Indexes
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ isActive: 1 });
conversationSchema.index({ 'deleted.isDeleted': 1 });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
