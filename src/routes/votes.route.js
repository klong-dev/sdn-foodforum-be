const express = require('express')
const router = express.Router()
const { create } = require('../controllers/vote')

router.post('/', create)

module.exports = router