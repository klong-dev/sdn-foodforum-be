const express = require('express')
const router = express.Router();
const { create, getAll } = require('../controllers/comment')

router.post('/', create)
router.get('/:postId', getAll)

module.exports = router