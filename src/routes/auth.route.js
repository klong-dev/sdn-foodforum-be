const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

// Web routes (for EJS views)
router.get('/login', authController.getLoginPage);
router.get('/register', authController.getRegisterPage);

// Routes that handle both web forms and API requests
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);  // Changed to GET for web navigation
router.post('/logout', authController.logout); // Keep POST for API compatibility

// API-specific routes
router.post('/refresh-token', authController.refreshToken);

module.exports = router;