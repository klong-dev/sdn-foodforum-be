const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { verifyToken } = require('../middlewares/auth.middleware');

// CRUD routes
router.get('/', userController.getUsers);
router.get('/me', verifyToken, userController.getMe);
router.get('/profile/:username', userController.getUserProfile);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;