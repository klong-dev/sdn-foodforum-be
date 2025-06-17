const Vote = require('../models/vote.model')
const Post = require('../models/post.model')
const Comment = require('../models/comment.model')

const createVote = async (data) => {
    console.log(data)
    const { user_id, target_id, target_type, vote_type } = data

    if (!user_id || !target_id || !target_type || !vote_type) {
        throw new Error("Missing required fields")
    }

    if (!['upvote', 'downvote'].includes(vote_type)) {
        throw new Error('Invailid vote_type')
    }

    if (target_type === 'post') {
        const post = await Post.findById(target_id)
        if (!post) throw new Error(`Cannot find any post wiht the id: ${target_id}`)
    } else if (target_type === 'comment') {
        const comment = await Comment.findById(target_id)
        console.log(comment)
        if (!comment) throw new Error(`Cannot find any comment wiht the id: ${target_id}`)
    }

    const vote = new Vote({
        user_id,
        target_id,
        target_type,
        vote_type
    })

    const result = await vote.save()
    return result;
}

module.exports = { createVote }