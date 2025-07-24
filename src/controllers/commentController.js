const Comment = require('../models/comment.model');

// Tạo bình luận mới
exports.createComment = async (req, res) => {
    try {
        const { post_id, content, parent_id } = req.body;
        const user_id = req.user.id;
        const comment = new Comment({ post_id, user_id, content, parent_id: parent_id || null });
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách bình luận (phân trang, lồng nhau)
exports.getComments = async (req, res) => {
    try {
        const { post_id } = req.query;
        const { page = 1, limit = 10 } = req.query;
        // Lấy bình luận gốc (parent_id=null)
        const rootComments = await Comment.find({ post_id, parent_id: null })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        // Lấy tất cả bình luận con
        const allComments = await Comment.find({ post_id });
        // Xây cây bình luận
        const buildTree = (parent, comments) => {
            const children = comments.filter(c => String(c.parent_id) === String(parent._id));
            return {
                ...parent.toObject(),
                children: children.map(child => buildTree(child, comments))
            };
        };
        const result = rootComments.map(root => buildTree(root, allComments));
        res.json({ comments: result, total: await Comment.countDocuments({ post_id, parent_id: null }) });
    } catch (error) {
        res.status(500).json({ error: error.message });
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