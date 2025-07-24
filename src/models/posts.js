const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    title_normalized: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    description_normalized: {
        type: String,
        required: true,
        trim: true
    },
    thumbnailUrl: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectedReason: {
        type: String,
        default: ''
    },
    slug: {
        type: String,
        required: true,
        trim: true
    },
    prepTimeMinutes: {
        type: Number,
        default: 0
    },
    cookTimeMinutes: {
        type: Number,
        default: 0
    },
    servings: {
        type: Number,
        default: 0
    },
    ingredients: [
        {
            name: {
                type: String,
                required: true,
                trim: true
            },
            name_normalized: {
                type: String,
                required: true,
                trim: true
            },
            quantity: {
                type: String,
                required: true,
                trim: true
            },
            imageUrl: {
                type: String,
                required: true,
                trim: true
            }
        }
    ],
    instructions: [
        {
            stepNumber: {
                type: Number,
                required: true
            },
            stepDescription: {
                type: String,
                required: true,
                trim: true
            },
            stepDescription_normalized: {
                type: String,
                required: true,
                trim: true
            },
            imageUrl: {
                type: String,
                required: true,
                trim: true
            }
        }
    ],
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    notes_normalized: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        default: ''
    },
    categories: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Category',
        default: []
    },
    viewsCount: {
        type: Number,
        default: 0
    },
    upvotes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    downvotes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    comments: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Comment',
        default: []
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
    publishedAt: {
        type: Date,
        default: Date.now
    },
    deleted: {
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        }
    }
});

module.exports = mongoose.model('Post', postSchema);