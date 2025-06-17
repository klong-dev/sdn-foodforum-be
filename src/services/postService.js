const post = require('../models/posts.model')

const postService = {
    createPost: async (userId, postData) => {
        const newPost = new post({ ...postData, author: userId });
        return await newPost.save();
    },

    getAllPosts: async () => {
        return await post.find({ status: { $ne: 'deleted' } }).populate('author');
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
            deletedAt: new Date()
        }, { new: true });
    },

    getPostsByUser: async (userId) => {
        return await post.find({ author: userId }).populate('author');
    },
};
module.exports = postService;