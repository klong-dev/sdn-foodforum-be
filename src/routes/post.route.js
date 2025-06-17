const express = require('express');
const router = express.Router();

const postController = require('../controllers/post');
const authMiddleware = require('../middlewares/auth.middleware');
const { validatePost } = require('../middlewares/validation.middleware');
const { upload } = require('../middlewares/upload.middleware');
const { requireRole, requirePermission } = authMiddleware;

router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);
router.get('/user/:userId', postController.getPostsByUser);
router.post('/', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.createPost);
router.put('/:id', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost);
router.patch('/:id', authMiddleware.verifyToken, upload.single('image'), validatePost, postController.updatePost);
router.delete('/:id', authMiddleware.verifyToken, requirePermission('post:delete'), postController.deletePost);

module.exports = router;