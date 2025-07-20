const express = require('express');
const router = express.Router();

const postController = require('../controllers/post');
const authMiddleware = require('../middlewares/auth.middleware');
const { validatePost } = require('../middlewares/validation.middleware');
const { upload } = require('../middlewares/upload.middleware');
const { requireRole, requirePermission } = authMiddleware;

/**
 * GET /api/posts?tag=...&search=...&page=...&limit=...
 * Lấy danh sách post, hỗ trợ filter theo tag, tìm kiếm tiêu đề, phân trang
 */
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);
router.get('/user/:userId', postController.getPostsByUser);
router.get('/tag/:tag', postController.getPostsByTag);
router.post('/', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.createPost);
router.put('/:id', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost);
router.patch('/:id', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost);
router.delete('/:id', authMiddleware.verifyToken, postController.deletePost);

module.exports = router;