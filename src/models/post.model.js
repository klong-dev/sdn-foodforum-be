const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subcategory_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    is_locked: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true })

module.exports = mongoose.model('Post', postSchema)