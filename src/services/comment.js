const Comment = require('../models/comment.model')

//Create a new Comment 
const createComment = async (data) => {
    const { post_id, user_id, content } = data
    if (!post_id || !user_id || !content) {
        throw new Error("Missing required fields")
    }
    const comment = new Comment({
        post_id,
        user_id,
        content
    })

    const result = await comment.save()
    return result
}

//Get all comments by Post's id
const getAllCommentsByPostId = async (id) => {
    if (!id) {
        throw new Error("Missing postId")
    }
    const comments = await Comment.find({ post_id: id })
    return comments

}

module.exports = { createComment, getAllCommentsByPostId }