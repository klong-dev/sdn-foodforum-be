const express = require('express');
const router = express.Router();

const usersRoute = require('./users.route');
const postsRoute = require('./posts.route');

router.use('/users', usersRoute);
router.use('/post', postsRoute)

module.exports = router;