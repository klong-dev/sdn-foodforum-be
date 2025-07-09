const express = require('express');
const router = express.Router();
const usersRoute = require('./users.route');
const authRoute = require('./auth.route');
const testRoute = require('./test.route');
const voteRoute = require('./votes.route')
const postsRoute = require('./post.route');
const conversationRoute = require('./conversationRoutes');
const messageRoute = require('./messageRoutes');


// Mount routes
router.use('/api/users', usersRoute);
router.use('/api/auth', authRoute);
router.use('/api/conversations', conversationRoute);
router.use('/api/messages', messageRoute);
router.use('/api/test', testRoute);
router.use('/api/posts', postsRoute);
router.use('/api/vote', voteRoute)

module.exports = router;