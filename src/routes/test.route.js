const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

// Admin-only route
router.get('/admin-test', authMiddleware.verifyToken, authMiddleware.requireRole('admin'), (req, res) => {
    res.json({ message: 'Admin access granted', user: req.user });
});

// Moderator or higher route
router.get('/mod-test', authMiddleware.verifyToken, authMiddleware.requireRole(['moderator', 'admin']), (req, res) => {
    res.json({ message: 'Moderator access granted', user: req.user });
});

// Permission-based route
router.delete('/posts/:id', authMiddleware.verifyToken, authMiddleware.requirePermission('post:delete'), (req, res) => {
    res.json({ message: 'Post delete permission granted' });
});

module.exports = router;