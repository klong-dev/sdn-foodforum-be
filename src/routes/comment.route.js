const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment');
const authMiddleware = require('../middlewares/auth.middleware');

// Get comments for a specific post
router.get('/post/:postId', commentController.getCommentsByPostId);

// Create a new comment (requires authentication)
router.post('/post/:postId', authMiddleware.verifyToken, commentController.createComment);

// Update a comment (requires authentication)
router.put('/:id', authMiddleware.verifyToken, commentController.updateComment);

// Delete a comment (requires authentication)
router.delete('/:id', authMiddleware.verifyToken, commentController.deleteComment);

module.exports = router;
