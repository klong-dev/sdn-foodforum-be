const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const authMiddleware = require('../middlewares/auth.middleware');

// web UI routes
router.get('/profile', userController.getProfile); // Current user's profile
router.get('/profile/:id', userController.getProfile); // Any user's profile
router.get('/edit-profile', userController.getEditProfilePage);
router.post('/edit-profile', userController.updateProfileWeb);

// API routes 
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;