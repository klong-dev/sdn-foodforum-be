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
    /**
     * Đường dẫn ảnh chính của món ăn (có thể là string hoặc array of strings)
     */
    image: {
        type: [String],
        default: []
    },
    /**
     * Danh sách tag/phân loại món ăn (ví dụ: 'ăn sáng', 'healthy', 'món chay')
     */
    tags: [{ type: String, trim: true }],
    /**
     * Danh sách nguyên liệu của món ăn
     */
    ingredients: [{ type: String, trim: true }],
    /**
     * Hướng dẫn/cách làm món ăn
     */
    instructions: { type: String, trim: true },
    /**
     * Số lượt xem bài post
     */
    views: { type: Number, default: 0 },
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