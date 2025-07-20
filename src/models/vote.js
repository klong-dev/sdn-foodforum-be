const mongoose = require('mongoose')

const voteSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    voter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    voteType: {
        type: String,
        enum: ['upvote', 'downvote'],
        required: true,
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
    }
}, { timestamps: true })

module.exports = mongoose.model('Vote', voteSchema)

