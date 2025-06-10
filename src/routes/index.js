const express = require('express');
const router = express.Router();

// Import routes
const usersRoute = require('./users.route');
const authRoute = require('./auth.route');

// Mount routes
router.use('/users', usersRoute);
router.use('/auth', authRoute);

module.exports = router;