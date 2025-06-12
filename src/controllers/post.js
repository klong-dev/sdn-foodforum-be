const { createPost } = require('../services/post')

const create = async (req, res) => {
    try {
        console.log(req.body)
        const post = await createPost(req.body)
        if (post) {
            res.status(201).json({
                message: 'Create Post successfully',
                post
            })
        }
    } catch (e) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = {create}