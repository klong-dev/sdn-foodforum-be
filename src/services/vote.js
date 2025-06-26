const Vote = require('../models/vote.model')
const Post = require('../models/posts.model')
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

    const existingVote = await Vote.findOne({ user_id, target_id });
    if (existingVote) {
        if (existingVote.vote_type === vote_type) return existingVote

        existingVote.vote_type = vote_type
        return await existingVote.save()
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



const getVotes = async (id) => {
    const upvotes = await Vote.countDocuments({
        target_id: id,
        vote_type: 'upvote'
    })

    const downvotes = await Vote.countDocuments({
        target_id: id,
        vote_type: 'downvote'
    })

    const netVote = upvotes - downvotes;

    return {
        target_id: id,
        upvotes,
        downvotes,
        netVote,
    }
}




const deleteVote = async (data) => {
    const { user_id, target_id } = data

    if (!user_id || !target_id) {
        throw new Error("Missing required fields")
    }

    const deleted = await Vote.findOneAndDelete({ user_id, target_id })

    if (!deleted) throw new Error('Vote not found or already deleted')

    return deleted
}

module.exports = { createVote, getVotes, deleteVote }