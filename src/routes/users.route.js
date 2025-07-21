const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const authMiddleware = require('../middlewares/auth.middleware');
const uploadMiddleware = require('../middlewares/upload.middleware');

// Get current user profile (requires authentication)
router.get('/me', authMiddleware.verifyToken, userController.getCurrentUser);
router.get('/me/posts', authMiddleware.verifyToken, userController.getCurrentUserPosts);


// CRUD routes
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/me', authMiddleware.verifyToken, userController.updateUser);
router.patch('/:id/status', authMiddleware.verifyToken, authMiddleware.requireRole('admin'), userController.updateUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;