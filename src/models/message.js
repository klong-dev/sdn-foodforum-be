const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'file'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        mimeType: String
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    edited: {
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: Date,
        originalContent: String
    },
    deleted: {
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: Date,
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Check if message can be edited (within 5 minutes)
messageSchema.methods.canEdit = function () {
    const editTimeLimit = 5 * 60 * 1000; // 5 minutes
    return Date.now() - this.createdAt.getTime() < editTimeLimit;
};

// Edit message
messageSchema.methods.editMessage = function (newContent) {
    if (!this.canEdit()) {
        throw new Error('Message can no longer be edited');
    }

    this.edited.originalContent = this.content;
    this.content = newContent;
    this.edited.isEdited = true;
    this.edited.editedAt = new Date();
};

// Soft delete message
messageSchema.methods.softDelete = function (userId) {
    this.deleted.isDeleted = true;
    this.deleted.deletedAt = new Date();
    this.deleted.deletedBy = userId;
    this.content = 'This message was deleted';
    this.attachments = [];
};

// Mark as read by user
messageSchema.methods.markAsRead = async function (userId) {
    const alreadyRead = this.readBy.find(r => r.user.toString() === userId.toString());
    if (!alreadyRead) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
        return await this.save();
    }
    return this;
};

// Add reaction
messageSchema.methods.addReaction = async function (userId, emoji) {
    const existingReaction = this.reactions.find(r =>
        r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
        // Remove reaction if it already exists
        this.reactions = this.reactions.filter(r =>
            !(r.user.toString() === userId.toString() && r.emoji === emoji)
        );
    } else {
        // Remove any existing reaction from this user and add new one
        this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
        this.reactions.push({
            user: userId,
            emoji,
            createdAt: new Date()
        });
    }

    return await this.save();
};

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'deleted.isDeleted': 1 });
messageSchema.index({ replyTo: 1 });

module.exports = mongoose.model('Message', messageSchema);
