const { message } = require('statuses');
const { createVote, getVotes, deleteVote, getUserVote, getTopPostsByVotes } = require('../services/vote')

const create = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { target_id, target_type, vote_type } = req.body;
        const vote = await createVote({ user_id, target_id, target_type, vote_type });
        if (vote) {
            const result = await getVotes(target_id);
            const userVote = await getUserVote(user_id, target_id);
            res.status(200).json({
                message: `Created vote succesfuly!`,
                vote,
                result,
                userVote: userVote ? userVote.vote_type : null
            })
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

const get = async (req, res) => {
    try {
        const user_id = req.user.id;
        const target_id = req.params.targetId;
        const result = await getVotes(target_id);
        const userVote = await getUserVote(user_id, target_id);
        res.status(200).json({
            message: `This is the number of votes of ${target_id}`,
            result,
            userVote: userVote ? userVote.vote_type : null
        })
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
}

const remove = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { target_id } = req.body;
        const result = await deleteVote({ user_id, target_id });
        res.status(200).json({
            message: 'Deleted succesfully',
            result
        })
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
}

const getTop = async (req, res) => {
    try {
        const { period = 'day', limit = 10 } = req.query;
        const topPosts = await getTopPostsByVotes(period, parseInt(limit));
        res.status(200).json({ topPosts });
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
}

module.exports = { create, get, remove, getTop }