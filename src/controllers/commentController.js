const mongoose = require('mongoose');
const Comment = require('../models/comment');
const Post = require('../models/posts');
const User = require('../models/users.model');

// Đăng một comment mới (gốc hoặc reply)
exports.createComment = async (req, res) => {
    try {
        const { postId, content, parentId } = req.body;
        const userId = req.user.id;

        // Kiểm tra post tồn tại
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Nếu là reply, kiểm tra comment cha tồn tại
        let parent = null;
        if (parentId) {
            parent = await Comment.findById(parentId);
            if (!parent) return res.status(404).json({ message: 'Parent comment not found' });
        }

        const newComment = new Comment({
            post: postId,
            commenter: userId,
            content,
            parent: parentId || null
        });
        await newComment.save();

        // (Optional) Tăng số lượng comment cho post nếu muốn
        // await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

        res.status(201).json({ message: 'Comment created', comment: newComment });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create comment', error: error.message });
    }
};

// Lấy danh sách bình luận (phân trang, lồng nhau)
exports.getComments = async (req, res) => {
    try {
        const { post_id } = req.query;
        const { page = 1, limit = 10 } = req.query;
        // Lấy bình luận gốc (parent=null) và populate commenter
        const rootComments = await Comment.find({ post: post_id, parent: null })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('commenter', '-password');
        // Lấy tất cả bình luận con và populate commenter
        const allComments = await Comment.find({ post: post_id })
            .populate('commenter', '-password');
        // Xây cây bình luận
        const buildTree = (parent, comments) => {
            const children = comments.filter(c => String(c.parent) === String(parent._id));
            return {
                ...parent.toObject(),
                children: children.map(child => buildTree(child, comments))
            };
        };
        const result = rootComments.map(root => buildTree(root, allComments));
        res.json({ comments: result, total: await Comment.countDocuments({ post: post_id, parent: null }) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách bình luận của một user theo username
exports.getCommentsByUser = async (req, res) => {
    try {
        const { commenterUsername, page = 1, limit = 10 } = req.query;
        const user = await User.findOne({ username: commenterUsername });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const comments = await Comment.find({ commenter: user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('post', 'title slug')
            .lean();

        const total = await Comment.countDocuments({ commenter: user._id });

        res.json({ comments, total });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get user comments', error: error.message });
    }
};

// Chỉnh sửa bình luận
exports.editComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const user_id = req.user.id;
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (String(comment.user_id) !== String(user_id)) return res.status(403).json({ error: 'Not authorized' });
        comment.content = content;
        await comment.save();
        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xóa mềm bình luận
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const user_id = req.user.id;
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (String(comment.user_id) !== String(user_id)) return res.status(403).json({ error: 'Not authorized' });
        comment.content = '[deleted]';
        comment.deleted = true;
        await comment.save();
        res.json({ message: 'Comment deleted (soft)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upvote comment
exports.upvoteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Khởi tạo mảng upvotes/downvotes nếu chưa có
        if (!comment.upvotes) comment.upvotes = [];
        if (!comment.downvotes) comment.downvotes = [];

        // Nếu user đã upvote, bỏ upvote
        if (comment.upvotes.includes(userId)) {
            comment.upvotes = comment.upvotes.filter(id => id !== userId);
        } else {
            // Nếu user đang downvote, bỏ downvote
            comment.downvotes = comment.downvotes.filter(id => id !== userId);
            // Thêm upvote
            comment.upvotes.push(userId);
        }
        await comment.save();
        res.json({ message: 'Upvote updated', upvotes: comment.upvotes.length, downvotes: comment.downvotes.length });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upvote comment', error: error.message });
    }
};

// Downvote comment
exports.downvoteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Khởi tạo mảng upvotes/downvotes nếu chưa có
        if (!comment.upvotes) comment.upvotes = [];
        if (!comment.downvotes) comment.downvotes = [];

        // Nếu user đã downvote, bỏ downvote
        if (comment.downvotes.includes(userId)) {
            comment.downvotes = comment.downvotes.filter(id => id !== userId);
        } else {
            // Nếu user đang upvote, bỏ upvote
            comment.upvotes = comment.upvotes.filter(id => id !== userId);
            // Thêm downvote
            comment.downvotes.push(userId);
        }
        await comment.save();
        res.json({ message: 'Downvote updated', upvotes: comment.upvotes.length, downvotes: comment.downvotes.length });
    } catch (error) {
        res.status(500).json({ message: 'Failed to downvote comment', error: error.message });
    }
}; 