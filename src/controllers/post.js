const postService = require('../services/postService.js');
const PostImage = require('../models/postImages.model.js');
const voteService = require('../services/vote.js');
const userService = require('../services/user.js');

const postController = {
    createPost: async (req, res) => {
        try {
            const userId = req.user.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const postData = req.body;

            // Handle recipe fields
            if (postData['recipe.prepTime'] || postData['recipe.cookTime'] ||
                postData['recipe.servings'] || postData['recipe.difficulty']) {
                postData.recipe = {
                    prepTime: postData['recipe.prepTime'],
                    cookTime: postData['recipe.cookTime'],
                    servings: postData['recipe.servings'],
                    difficulty: postData['recipe.difficulty']
                };

                // Clean up the flat keys
                delete postData['recipe.prepTime'];
                delete postData['recipe.cookTime'];
                delete postData['recipe.servings'];
                delete postData['recipe.difficulty'];
            }

            // Parse recipe fields if they exist
            if (postData.ingredients && typeof postData.ingredients === 'string') {
                const ingredients = postData.ingredients.split('\n').filter(item => item.trim());
                if (ingredients.length > 0) {
                    if (!postData.recipe) postData.recipe = {};
                    postData.recipe.ingredients = ingredients;
                }
                delete postData.ingredients;
            }
            if (postData.instructions && typeof postData.instructions === 'string') {
                const instructions = postData.instructions.split('\n').filter(item => item.trim());
                if (instructions.length > 0) {
                    if (!postData.recipe) postData.recipe = {};
                    postData.recipe.instructions = instructions;
                }
                delete postData.instructions;
            }

            // Create post first
            const newPost = await postService.createPost(userId, postData);

            // Handle image upload
            if (req.file) {
                const imageUrl = req.file.secure_url || req.file.url || req.file.path;

                if (!imageUrl) {
                    console.error('No image URL found in file object');
                    throw new Error('Image upload failed - no URL found');
                }


                // Create PostImage document
                const postImage = new PostImage({
                    post: newPost._id,
                    url: imageUrl
                });

                const savedImage = await postImage.save();

                // Add image ID to post's images array
                newPost.images.push(savedImage._id);
                await newPost.save();
            }

            // Populate the response with images
            const populatedPost = await postService.getPostById(newPost._id);
            res.status(201).json(populatedPost);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getPosts: async (req, res) => {
        try {
            const posts = await postService.getAllPosts();
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getPostById: async (req, res) => {
        try {
            const post = await postService.getPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            // Get vote information
            const voteInfo = await voteService.getVotes(req.params.id);

            // Check if current user has voted (if authenticated)
            let userVote = null;
            let isFavorited = false;

            if (req.user) {
                userVote = await voteService.getUserVote(req.user.id, req.params.id);

                // Check if post is in user's favorites
                const user = await userService.getUserById(req.user.id);
                isFavorited = user && user.favoritePost.some(fav => fav.equals(req.params.id));
            }

            const postWithVotes = {
                ...post.toObject(),
                voteInfo,
                userVote: userVote ? userVote.vote_type : null,
                isFavorited
            };

            res.status(200).json(postWithVotes);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updatePost: async (req, res) => {
        try {
            const postData = req.body;

            // Parse recipe fields if they exist
            if (postData.ingredients && typeof postData.ingredients === 'string') {
                postData.ingredients = postData.ingredients.split('\n').filter(item => item.trim());
            }
            if (postData.instructions && typeof postData.instructions === 'string') {
                postData.instructions = postData.instructions.split('\n').filter(item => item.trim());
            }

            // Handle new image upload
            if (req.file) {
                const imageUrl = req.file.secure_url || req.file.url;

                // Create PostImage document
                const postImage = new PostImage({
                    post: req.params.id,
                    url: imageUrl
                });

                const savedImage = await postImage.save();

                // Add image ID to postData for update
                if (!postData.images) postData.images = [];
                postData.images.push(savedImage._id);
            }

            const updatedPost = await postService.updatePost(req.params.id, postData);
            if (!updatedPost) {
                return res.status(404).json({ message: 'Post not found' });
            }
            res.status(200).json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deletePost: async (req, res) => {
        try {
            const deletedPost = await postService.deletePost(req.params.id);
            if (!deletedPost) {
                return res.status(404).json({ message: 'Post not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getPostsByUser: async (req, res) => {
        try {
            const posts = await postService.getPostsByUser(req.params.userId);
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    },

    getPostsByCategory: async (req, res) => {
        try {
            const posts = await postService.getPostsByCategory(req.params.categoryId);
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    },

    getPostsByFilter: async (req, res) => {
        try {
            const { filter } = req.query; // 'hot', 'new', 'top'
            const posts = await postService.getPostsByFilter(filter);
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    },

    getReportedPosts: async (req, res) => {
        try {
            const posts = await postService.getReportedPosts();
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    },

    getPendingPosts: async (req, res) => {
        try {
            const posts = await postService.getPendingPosts();
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    },

    approvePost: async (req, res) => {
        try {
            // Check moderator permission
            if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
                return res.status(403).json({
                    message: 'Permission denied: Moderator or Admin privileges required'
                });
            }

            const { id } = req.params;
            const updatedPost = await postService.approvePost(id);

            if (!updatedPost) {
                return res.status(404).json({
                    message: 'Post not found'
                });
            }

            res.status(200).json({
                message: 'Post approved successfully',
                post: updatedPost
            });
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    },

    rejectPost: async (req, res) => {
        try {
            // Check moderator permission
            if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
                return res.status(403).json({
                    message: 'Permission denied: Moderator or Admin privileges required'
                });
            }

            const { id } = req.params;
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({
                    message: 'Rejection reason is required'
                });
            }

            const updatedPost = await postService.rejectPost(id, reason);

            if (!updatedPost) {
                return res.status(404).json({
                    message: 'Post not found'
                });
            }

            res.status(200).json({
                message: 'Post rejected successfully',
                post: updatedPost
            });
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    }
};

module.exports = postController;