const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const commentRoute = require('../routes/comments.route')
const voteRoute = require('../routes/votes.route')

const postsRoute = require('./post.route');
const homeRoute = require('./home.route')

// ADD THESE LINES:
const usersRoute = require('./users.route');
const authRoute = require('./auth.route');
const testRoute = require('./test.route');

// Mount routes
router.use('/users', usersRoute);
router.use('/auth', authRoute);
router.use('/test', testRoute);
router.use('/posts', postsRoute);
router.use('/comment', commentRoute)
router.use('/vote', voteRoute)
router.use('/', homeRoute)

module.exports = router;