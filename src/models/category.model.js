const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true,
        default: '#3B82F6'
    },
    icon: {
        type: String,
        trim: true
    },
    subreddit: {
        type: String,
        trim: true,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    postCount: {
        type: Number,
        default: 0
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
});

module.exports = mongoose.model('Category', categorySchema);
