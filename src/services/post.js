const Post = require('../models/post.model')

//create a new Post
exports.createPost = async (data) => {

    const { user_id, title, content } = data
    if (!user_id || !title || !content) {
        throw new Error("Missing required fields")
    }
    const post = new Post({ user_id, title, content })
    const result = await post.save()
    return result
}

