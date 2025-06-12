const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const postRoute = require('../routes/posts.route')
const commentRoute = require('../routes/comments.route')


// Mount routes
router.use('/post', postRoute)
router.use('/comment', commentRoute)

module.exports = router;