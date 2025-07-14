const { message } = require('statuses');
const { createVote, getVotes, deleteVote } = require('../services/vote')

const create = async (req, res) => {
    try {
        const voteData = {
            ...req.body,
            user_id: req.user.id // Get user ID from authenticated request
        }
        const vote = await createVote(voteData)
        if (vote) {
            res.status(200).json({
                message: `Created vote successfully!`,
                vote
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

const get = async (req, res) => {
    try {
        // Get user ID if authenticated, otherwise null
        const userId = req.user ? req.user.id : null;
        const result = await getVotes(req.params.targetId, userId)

        if (result) {
            res.status(200).json({
                message: `Retrieved votes for ${req.params.targetId}`,
                result
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
}

const remove = async (req, res) => {
    try {
        const deleteData = {
            ...req.body,
            user_id: req.user.id // Get user ID from authenticated request
        }
        const result = await deleteVote(deleteData)

        if (result) {
            res.status(200).json({
                message: 'Deleted successfully',
                result
            })
        }

    } catch (e) {
        res.status(400).json({ error: e.message })
    }
}

module.exports = { create, get, remove }