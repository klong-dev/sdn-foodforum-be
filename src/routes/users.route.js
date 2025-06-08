const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Get all users' });
});

router.get('/:id', (req, res) => {
    const userId = req.params.id;
    res.json({ message: `Get user with ID ${userId}` });
});

// Example: Create a new user
router.post('/', (req, res) => {
    res.json({ message: 'Create new user' });
});

module.exports = router;
