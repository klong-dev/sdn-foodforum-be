const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const usersRoute = require('./users.route');
const authRoute = require('./auth.route');
const testRoute = require('./test.route');


// Mount routes
router.use('/users', usersRoute);
router.use('/auth', authRoute);
router.use('/test', testRoute);

module.exports = router;