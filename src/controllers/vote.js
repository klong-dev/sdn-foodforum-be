const { message } = require('statuses');
const { createVote, getVotes, deleteVote } = require('../services/vote')

const create = async (req, res) => {
    try {
        const vote = await createVote(req.body)
        if (vote) {
            res.status(200).json({
                message: `Created vote succesfuly!`,
                vote
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

const get = async (req, res) => {
    try {
        const result = await getVotes(req.params.targetId)

        if (result) {
            res.status(200).json({
                message: `This is the number of votes of ${req.params.targetId}`,
                result
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
}

const remove = async (req, res) => {
    try {
        const result = await deleteVote(req.body)

        if (result) {
            res.status(200).json({
                message: 'Deleted succesfully',
                result
            })
        }

    } catch (e) {
        res.status(400).json({ error: e.message })
    }
}

module.exports = { create, get, remove }