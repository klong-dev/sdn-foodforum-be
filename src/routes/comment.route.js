const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, commentController.createComment);
router.get('/', commentController.getComments);
router.get('/user-comments', commentController.getCommentsByUser);
router.put('/:commentId', verifyToken, commentController.editComment);
router.delete('/:commentId', verifyToken, commentController.deleteComment);
router.post('/:commentId/upvote', verifyToken, commentController.upvoteComment);
router.post('/:commentId/downvote', verifyToken, commentController.downvoteComment);

module.exports = router; 