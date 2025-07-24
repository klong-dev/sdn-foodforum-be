const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// CRUD routes
router.get('/', userController.getUsers);
router.get('/me', verifyToken, userController.getMe);
router.get('/profile/:username', userController.getUserProfile);
router.get('/friend-requests', verifyToken, userController.getFriendRequests);
router.get('/:id', userController.getUserById);
router.put('/:id', verifyToken, userController.updateUser);
router.patch('/me', verifyToken, userController.updateUser);
router.patch('/:id/status', verifyToken, requireRole('admin'), userController.updateUserStatus);
router.patch('/:id/change-password', verifyToken, userController.changePassword);
router.delete('/:id', userController.deleteUser);
router.post('/:id/send-friend-request', verifyToken, userController.sendFriendRequest);
router.post('/respond-friend-request', verifyToken, userController.respondFriendRequest);
router.get('/:id/friends', verifyToken, userController.getFriends);

module.exports = router;