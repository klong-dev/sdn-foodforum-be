const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middlewares/auth.middleware');

router.use(auth.verifyToken);

router.post('/', commentController.createComment);
router.get('/', commentController.getComments);
router.put('/:commentId', commentController.editComment);
router.delete('/:commentId', commentController.deleteComment);

module.exports = router; 