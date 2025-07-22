const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/upload.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// POST /api/upload/image
router.post(
    '/image',
    authMiddleware.verifyToken,
    upload.single('image'),
    (req, res) => {
        if (req.file && req.file.path) {
            res.json({ imageUrl: req.file.path });
        } else {
            res.status(400).json({ error: 'No image uploaded' });
        }
    }
);

module.exports = router; 