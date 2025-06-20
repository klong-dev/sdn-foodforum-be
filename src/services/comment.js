const Comment = require('../models/comment.model')
const { getVotes } = require('../services/vote')
const { timeAgo } = require('../utils/index');

//Create a new Comment 
const createComment = async (data) => {
    const { post_id, user_id, content, parent_id = null } = data
    if (!post_id || !user_id || !content) {
        throw new Error("Missing required fields")
    }
    const comment = new Comment({
        post_id,
        user_id,
        content,
        parent_id
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
        .populate('user_id', 'username')
        .sort({ createdAt: -1 });

    const commentsWithVote = [];
    for (const comment of comments) {
        const voteData = await getVotes(comment._id);
        commentsWithVote.push({
            ...comment.toObject(),
            voteData,
            timeAgo: timeAgo(comment.createdAt),
        });
    }

    // Threading logic
    const topLevelComments = commentsWithVote.filter(c => !c.parent_id);
    const replies = commentsWithVote.filter(c => c.parent_id);

    const threaded = topLevelComments.map(parent => {
        return {
            ...parent,
            replies: replies.filter(child => child.parent_id?.toString() === parent._id.toString())
        };
    });

    return {
        threaded,
        totalCount: commentsWithVote.length,
    };
}

const getCommentByCommentId = async (id) => {
    if (!id) {
        throw new Error("Missing CommentId")
    }

    const comment = await Comment.find({ _id: id })
    return comment
}

const deleteComment = async (data) => {
    const { post_id, user_id } = data;

    if (!post_id || !user_id) throw new Error('Missing required fields')

    const deleted = await Comment.findOneAndDelete({ post_id, user_id })
    if (!deleted) throw new Error('Comment not found or already deleted')

    return deleted
}

const updateComment = async (id, userId, newContent) => {

    const comment = await Comment.findById(id)
    console.log(comment)

    if (!comment) throw new Error('Comment not found!')

    if (comment.user_id.toString() !== userId) throw new Error('Unauthorized to update this comment')

    comment.content = newContent
    return await comment.save()
}

module.exports = { createComment, getAllCommentsByPostId, getCommentByCommentId, deleteComment, updateComment }