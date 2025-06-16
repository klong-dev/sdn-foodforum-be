const mongoose = require('mongoose');
const Conversation = require('./conversation');
const User = require('./user');

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
            required: true,
            min: 0,
            max: 10485760 // 10MB limit
        },
        mimeType: String // e.g., 'image/jpeg', 'application/pdf'
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
        editHistory: [{
            content: String,
            editedAt: Date
        }]
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
}, {
    timestamps: true
});

// Ensure sender is a participant in the conversation
messageSchema.pre('save', async function (next) {
    const Conversation = mongoose.model('Conversation');
    const conversation = await Conversation.findById(this.conversation);

    if (!conversation) {
        return next(new Error('Conversation not found for this message.'));
    }

    console.log(conversation.participants);
    console.log(this.sender);

    if (!conversation.participants.find(p => p.user.toString() === this.sender._id.toString())) {
        return next(new Error('Sender must be a participant in the conversation'));
    }
    next();
});

// Validate edit time limit (e.g., 5 minutes)
messageSchema.methods.canEdit = function () {
    const editTimeLimit = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() - this.createdAt < editTimeLimit;
};

// Track message edits
messageSchema.methods.edit = function (newContent) {
    if (!this.canEdit()) {
        throw new Error('Message can no longer be edited');
    }

    this.edited.editHistory.push({
        content: this.content,
        editedAt: this.edited.editedAt || this.createdAt
    });

    this.content = newContent;
    this.edited.isEdited = true;
    this.edited.editedAt = new Date();
};

// Soft delete message
messageSchema.methods.softDelete = function (userId) {
    this.deleted = {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
    };
    this.content = 'This message was deleted';
    this.attachments = [];
};

// Mark message as read by user
messageSchema.methods.markAsRead = async function (userId) {
    if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
        await this.save();
    }
};

// Indexes for faster queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ replyTo: 1 });
messageSchema.index({ 'deleted.isDeleted': 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;