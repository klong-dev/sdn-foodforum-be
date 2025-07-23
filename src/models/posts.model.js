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
    imageUrl: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['approved', 'pending', 'rejected', 'deleted', 'flagged', 'reported'],
        default: 'pending'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    votes: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    // Recipe-specific fields
    recipe: {
        prepTime: {
            type: String,
            trim: true
        },
        cookTime: {
            type: String,
            trim: true
        },
        totalTime: {
            type: String,
            trim: true
        },
        servings: {
            type: String,
            trim: true
        },
        difficulty: {
            type: String,
            enum: ['Easy', 'Intermediate', 'Advanced'],
            trim: true
        },
        ingredients: [{
            type: String,
            trim: true
        }],
        instructions: [{
            type: String,
            trim: true
        }]
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