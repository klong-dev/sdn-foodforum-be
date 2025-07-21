const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/auth.middleware');
const { validatePostNew } = require('../middlewares/validation.middleware');
const { upload } = require('../middlewares/upload.middleware');
const { verifyToken, requireRole, requirePermission } = authMiddleware;

/**
 * GET /api/posts?tag=...&search=...&page=...&limit=...
 * Lấy danh sách post, hỗ trợ filter theo tag, tìm kiếm tiêu đề, phân trang
 */
// router.get('/', postController.getPosts);
// router.get('/:id', postController.getPostById);
// router.get('/user/:userId', postController.getPostsByUser);
// router.get('/tag/:tag', postController.getPostsByTag);
// router.post('/', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.createPost);
// router.put('/:id', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost);
// router.patch('/:id', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost);
// router.delete('/:id', authMiddleware.verifyToken, requirePermission('post:delete'), postController.deletePost);

router.route('/')
    .get(postController.getAllPosts)
    .post(verifyToken, validatePostNew, postController.createPost);

router.route('/slugs/:slug')
    .get(postController.getPostBySlug);

// router.route('/:id')
//     .get(postController.getPostById)
//     .put(authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost)
//     .patch(authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost)



module.exports = router;