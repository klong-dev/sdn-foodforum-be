const { createPost } = require('../services/post')

const create = async (req, res) => {
    try {

        const post = await createPost({

            user_id: "684a711d4809fcd076b67125",
            title: "Test 3",
            content: "ASDASDNASDASD"

        })
        console.log("Result", post)
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

module.exports = { create }