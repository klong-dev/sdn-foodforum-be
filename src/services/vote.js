const Vote = require('../models/vote')
const Post = require('../models/posts')
const Comment = require('../models/comment')

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

const getUserVote = async (user_id, target_id) => {
    return await Vote.findOne({ user_id, target_id });
};

const getTopPostsByVotes = async (period = 'day', limit = 10) => {
    const now = new Date();
    let start;
    if (period === 'day') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
        const day = now.getDay();
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        start = new Date(0);
    }
    // Lấy tổng upvote cho mỗi post trong khoảng thời gian
    const pipeline = [
        { $match: { target_type: 'post', vote_type: 'upvote', createdAt: { $gte: start } } },
        { $group: { _id: '$target_id', upvotes: { $sum: 1 } } },
        { $sort: { upvotes: -1 } },
        { $limit: limit },
        { $lookup: { from: 'posts', localField: '_id', foreignField: '_id', as: 'post' } },
        { $unwind: '$post' }
    ];
    return await Vote.aggregate(pipeline);
};

module.exports = { createVote, getVotes, deleteVote, getUserVote, getTopPostsByVotes };