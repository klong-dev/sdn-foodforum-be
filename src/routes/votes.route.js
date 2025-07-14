const express = require('express')
const router = express.Router()
const { create, get, remove } = require('../controllers/vote')
const authMiddleware = require('../middlewares/auth.middleware')

router.post('/', authMiddleware.verifyToken, create)
router.get('/:targetId', authMiddleware.optionalVerifyToken, get)
router.delete('/', authMiddleware.verifyToken, remove)

module.exports = router