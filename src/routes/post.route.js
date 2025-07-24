const express = require('express');
const router = express.Router();

const postController = require('../controllers/post');
const authMiddleware = require('../middlewares/auth.middleware');
const { validatePost } = require('../middlewares/validation.middleware');
const { upload } = require('../middlewares/upload.middleware');
const { requireRole, requirePermission } = authMiddleware;

// Define specific routes before parameterized routes
router.get('/', postController.getPosts);
router.get('/filter', postController.getPostsByFilter);
router.get('/reported', authMiddleware.verifyToken, requireRole('moderator'), postController.getReportedPosts);
router.get('/pending', authMiddleware.verifyToken, requireRole('moderator'), postController.getPendingPosts);
router.get('/category/:categoryId', postController.getPostsByCategory);
router.get('/user/:userId', postController.getPostsByUser);

// Moderation endpoints
router.put('/:id/approve', authMiddleware.verifyToken, requireRole('moderator'), postController.approvePost);
router.put('/:id/reject', authMiddleware.verifyToken, requireRole('moderator'), postController.rejectPost);

// Generic ID route should be LAST
router.get('/:id', postController.getPostById);
router.post('/', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.createPost);
router.put('/:id', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost);
router.patch('/:id', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost);
router.delete('/:id', authMiddleware.verifyToken, postController.deletePost);

module.exports = router;