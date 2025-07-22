const post = require('../models/posts')

const postService = {
    createPost: async (userId, postData) => {
        const newPost = new post({ ...postData, author: userId });
        return await newPost.save();
    },

    getAllPosts: async ({ tag, search, page = 1, limit = 10 } = {}) => {
        const query = { status: { $ne: 'deleted' } };
        if (tag) query.tags = tag;
        if (search) query.title = { $regex: search, $options: 'i' };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        return await post.find(query)
            .populate('author')
            .skip(skip)
            .limit(parseInt(limit));
    },

    getPostById: async (id) => {
        return await post.findById(id).populate('author');
    },

    updatePost: async (id, postData) => {
        return await post.findByIdAndUpdate(id, postData, { new: true });
    },

    deletePost: async (id) => {
        return await post.findByIdAndUpdate(id, {
            status: 'deleted',
            'deleted.isDeleted': true,
            'deleted.deletedAt': new Date()
        }, { new: true });
    },

    getPostsByUser: async (userId) => {
        return await post.find({ author: userId }).populate('author');
    },

    increaseView: async (id) => {
        return await post.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    },

    getPostsByTag: async (tag) => {
        return await post.find({ tags: tag, status: { $ne: 'deleted' } }).populate('author');
    },
};
module.exports = postService;