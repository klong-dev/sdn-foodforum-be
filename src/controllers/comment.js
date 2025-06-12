const { message } = require('statuses');
const {createComment, getAllCommentsByPostId} = require('../services/comment')

const create = async (req, res) => {
    try {
        const comment = await createComment(req.body);
        if(comment) {
            res.status(201).json({
                message: "Create comment successfully!",
                comment
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}


const getAll = async (req, res) => {
    try {
        console.log(req.params)
        const allComments = await getAllCommentsByPostId(req.params.postId)
        if(allComments) {
            res.status(200).json({
                message: "Get all comments successfully!",
                allComments
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

module.exports = {create, getAll}