const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const authMiddleware = require('../middlewares/auth.middleware');

// CRUD routes
router.get('/', userController.getUsers);
// Add /me route before /:id to avoid conflict
router.get('/me', authMiddleware.verifyToken, userController.getCurrentUser);
router.get('/me/favorites', authMiddleware.verifyToken, userController.getFavoritePosts);
router.post('/me/favorites/:postId', authMiddleware.verifyToken, userController.addToFavorites);
router.delete('/me/favorites/:postId', authMiddleware.verifyToken, userController.removeFromFavorites);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;