const post = require('../models/posts.model')

const postService = {
    createPost: async (userId, postData) => {
        const newPost = new post({ ...postData, author: userId });
        return await newPost.save();
    },

    getAllPosts: async () => {
        return await post.find({ status: { $ne: 'deleted' } })
            .populate('author', 'username email')
            .populate('category')
            .populate('images')
            .sort({ createdAt: -1 });
    },

    getPostById: async (id) => {
        return await post.findById(id)
            .populate('author', 'username email')
            .populate('category')
            .populate('images');
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
        return await post.find({ author: userId })
            .populate('author')
            .populate('category')
            .populate('images');
    },

    getPostsByCategory: async (categoryId) => {
        return await post.find({
            category: categoryId,
            status: { $ne: 'deleted' }
        })
            .populate('author', 'username email')
            .populate('category')
            .populate('images')
            .sort({ createdAt: -1 });
    },

    getPostsByFilter: async (filter) => {
        let sortCriteria = {};
        let query = { status: { $ne: 'deleted' } };

        switch (filter) {
            case 'hot':
                // Sort by votes and recent activity
                sortCriteria = { votes: -1, createdAt: -1 };
                break;
            case 'new':
                sortCriteria = { createdAt: -1 };
                break;
            case 'top':
                sortCriteria = { votes: -1 };
                break;
            default:
                sortCriteria = { createdAt: -1 };
        }

        return await post.find(query)
            .populate('author', 'username email')
            .populate('category')
            .populate('images')
            .sort(sortCriteria);
    },
};
module.exports = postService;