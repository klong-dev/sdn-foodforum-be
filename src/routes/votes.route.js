const express = require('express')
const router = express.Router()
const { create, get, remove, getTop } = require('../controllers/vote')
const authMiddleware = require('../middlewares/auth.middleware')

router.post('/', authMiddleware.verifyToken, create)
router.get('/:targetId', authMiddleware.verifyToken, get)
router.get('/top/list', getTop);
router.delete('/', authMiddleware.verifyToken, remove)

module.exports = router