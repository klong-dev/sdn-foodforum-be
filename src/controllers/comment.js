const { message } = require('statuses');
const { createComment, getAllCommentsByPostId, getCommentByCommentId, deleteComment, updateComment } = require('../services/comment')

const create = async (req, res) => {
    try {
        const comment = await createComment(req.body);
        if (comment) {
           return  res.status(200).json({
                message: "Created comments successfully!",
                comment
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}


const getAll = async (req, res) => {
    try {
        const allComments = await getAllCommentsByPostId(req.params.postId)
        if (allComments) {
            res.status(200).json({
                message: "Get all comments successfully!",
                allComments
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

const getOne = async (req, res) => {
    try {
        const comment = await getCommentByCommentId(req.params.commentId)
        if (comment) {
            res.status(200).json({
                message: 'Get comment successfuly',
                comment
            })
        }

    } catch (e) {
        res.status(400).json({ error: e.message })
    }
}

const remove = async (req, res) => {
    try {
        const result = await deleteComment(req.body)

        if(result) {
            res.status(200).json({
                message: 'Deleted succesfully',
                result
            })
        }
    } catch (e) {
         res.status(400).json({ error: e.message })
    }
}

const update = async (req, res) => {
    try {
        const commentId = req.params.id
        const userId = req.body.user_id
        const content = req.body.content

        const updated = await updateComment(commentId, userId, content)

        if(updated) {
            res.status(200).json({
                message: 'Updated successfuly',
                updated
            })
        }
    } catch (e) {
        res.status(400).json({error: e.message})
    }
}

module.exports = { create, getAll, getOne, remove, update }