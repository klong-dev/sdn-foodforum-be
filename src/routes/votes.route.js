const express = require('express')
const router = express.Router()
const { create, get, remove } = require('../controllers/vote')

router.post('/', create)
router.get('/:targetId', get)
router.delete('/', remove)

module.exports = router