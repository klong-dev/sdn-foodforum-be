const express = require('express')
const router = express.Router();
const { create, getAll, getOne, remove, update } = require('../controllers/comment')

router.post('/', create)
router.get('/:postId', getAll)
router.get('/detail/:commentId', getOne)
router.delete('/', remove)
router.put('/:id', update)

module.exports = router