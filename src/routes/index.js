const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const usersRoute = require('./users.route');
const authRoute = require('./auth.route');
const testRoute = require('./test.route');
const voteRoute = require('./votes.route')
const commentRoute = require('./comments.route')

const postsRoute = require('./post.route');

// Mount routes
router.use('/users', usersRoute);
router.use('/auth', authRoute);
router.use('/test', testRoute);
router.use('/posts', postsRoute);
router.use('/vote', voteRoute)
router.use('/comment', commentRoute)

module.exports = router; 