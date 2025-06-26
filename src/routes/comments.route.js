const express = require('express')
const router = express.Router();
const { create, getAll, getOne, remove, update } = require('../controllers/comment')
const authMiddleware = require('../middlewares/auth.middleware')

router.post('/', authMiddleware.verifyToken, create)
router.get('/:postId', authMiddleware.verifyToken, getAll)
router.get('/detail/:commentId', authMiddleware.verifyToken, getOne)
router.delete('/', authMiddleware.verifyToken, remove)
router.put('/:id', authMiddleware.verifyToken, update)

module.exports = router