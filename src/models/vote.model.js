const mongoose = require('mongoose')

const voteSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    target_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    target_type: {
        type: String,
        enum: ['post', 'comment'],
        required: true,
    },
    vote_type: {
        type: String,
        enum: ['upvote', 'downvote'],
        required: true,
    },
}, { timestamps: true })

module.exports = mongoose.model('Vote', voteSchema)