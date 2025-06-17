const { message } = require('statuses');
const { createVote } = require('../services/vote')

const create = async (req, res) => {
    try {
        const vote = await createVote(req.body)
        if (vote) {
            res.status(201).json({
                message: "Create vote successfully",
                vote
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

module.exports = {create}