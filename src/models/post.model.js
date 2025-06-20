const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PostImage'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'closed', 'deleted', 'archived', 'pending', 'spam', 'flagged'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        set: function () {
            return Date.now();
        }
    },
});

module.exports = mongoose.model('Post', postSchema);