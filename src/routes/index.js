const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const postRoute = require('../routes/posts.route')
const commentRoute = require('../routes/comments.route')
const voteRoute = require('../routes/votes.route')

const postsRoute = require('./post.route');

// Mount routes
router.use('/users', usersRoute);
router.use('/auth', authRoute);
router.use('/test', testRoute);
router.use('/posts', postsRoute);
router.use('/comment', commentRoute)
router.use('/vote', voteRoute)

module.exports = router;