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



const getVotes = async (id, userId = null) => {
    const upvotes = await Vote.countDocuments({
        target_id: id,
        vote_type: 'upvote'
    })

    const downvotes = await Vote.countDocuments({
        target_id: id,
        vote_type: 'downvote'
    })

    const netVote = upvotes - downvotes;

    const result = {
        target_id: id,
        upvotes,
        downvotes,
        netVote,
        userVote: null
    }

    // If userId is provided, check user's current vote
    if (userId) {
        const userVote = await Vote.findOne({
            user_id: userId,
            target_id: id
        });
        result.userVote = userVote ? userVote.vote_type : null;
    }

    return result;
}




const deleteVote = async (data) => {
    const { user_id, target_id, target_type } = data

    if (!user_id || !target_id) {
        throw new Error("Missing required fields")
    }

    const query = { user_id, target_id };

    // Add target_type to query if provided
    if (target_type) {
        query.target_type = target_type;
    }

    const deleted = await Vote.findOneAndDelete(query)

    if (!deleted) throw new Error('Vote not found or already deleted')

    return deleted
}

const getUserVote = async (userId, targetId) => {
    const vote = await Vote.findOne({
        user_id: userId,
        target_id: targetId
    });
    return vote;
};

module.exports = { createVote, getVotes, deleteVote, getUserVote }