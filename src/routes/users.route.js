const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const authMiddleware = require('../middlewares/auth.middleware');

// Get current user profile (requires authentication)
router.get('/me', authMiddleware.verifyToken, userController.getCurrentUser);

// CRUD routes
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;