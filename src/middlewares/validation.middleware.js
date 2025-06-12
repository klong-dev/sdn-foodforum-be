// Simple validation middleware for posts
const validatePost = (req, res, next) => {
    const { title, content } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: 'Title is required and must be a non-empty string.' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: 'Content is required and must be a non-empty string.' });
    }

    next();
};

module.exports = { validatePost };