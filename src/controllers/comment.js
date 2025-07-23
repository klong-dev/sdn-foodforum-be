const Comment = require('../models/comment.model');
const Post = require('../models/posts.model');
const Vote = require('../models/vote.model');

const commentController = {
    // Get comments for a specific post
    getCommentsByPostId: async (req, res) => {
        try {
            const { postId } = req.params;
            const comments = await Comment.find({ post_id: postId, parent_id: null })
                .populate('user_id', 'username email')
                .sort({ createdAt: -1 });

            // Get replies for each comment
            const commentsWithReplies = await Promise.all(
                comments.map(async (comment) => {
                    const replies = await Comment.find({ parent_id: comment._id })
                        .populate('user_id', 'username email')
                        .sort({ createdAt: 1 });
                    return {
                        ...comment.toObject(),
                        replies
                    };
                })
            );

            res.status(200).json(commentsWithReplies);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Create a new comment
    createComment: async (req, res) => {
        try {
            const { postId } = req.params;
            const { content, parentId } = req.body;
            const userId = req.user.id;

            // Check if post exists
            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            // Create comment
            const comment = new Comment({
                post_id: postId,
                user_id: userId,
                content,
                parent_id: parentId || null
            });

            await comment.save();
            await comment.populate('user_id', 'username email');

            // Update post comment count if it's a top-level comment
            if (!parentId) {
                await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
            }

            res.status(201).json(comment);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update a comment
    updateComment: async (req, res) => {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const userId = req.user.id;

            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            // Check if user owns the comment
            if (comment.user_id.toString() !== userId) {
                return res.status(403).json({ message: 'Not authorized to update this comment' });
            }

            comment.content = content;
            await comment.save();
            await comment.populate('user_id', 'username email');

            res.status(200).json(comment);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Delete a comment
    deleteComment: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            // Check if user owns the comment
            if (comment.user_id.toString() !== userId) {
                return res.status(403).json({ message: 'Not authorized to delete this comment' });
            }

            // Delete replies first
            await Comment.deleteMany({ parent_id: id });

            // Delete votes associated with the comment
            await Vote.deleteMany({ target_id: id, target_type: 'comment' });

            // Also delete votes for all replies
            const replies = await Comment.find({ parent_id: id });
            for (const reply of replies) {
                await Vote.deleteMany({ target_id: reply._id, target_type: 'comment' });
            }

            // Delete the comment
            await Comment.findByIdAndDelete(id);

            // Update post comment count if it's a top-level comment
            if (!comment.parent_id) {
                await Post.findByIdAndUpdate(comment.post_id, { $inc: { commentCount: -1 } });
            }

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
};

module.exports = commentController;
