const postService = require('../services/postService.js');
const { getVotes } = require('../services/vote.js')
const { getAllCommentsByPostId } = require('../services/comment.js')

const postController = {
    createPost: async (req, res) => {
        try {
            const userId = req.user.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const postData = req.body;
            if (req.file) {
                postData.image = req.file.path;
            }
            const newPost = await postService.createPost(userId, postData);
            res.status(201).json(newPost);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getPosts: async (req, res) => {
        try {
            const posts = await postService.getAllPosts();

            const postWithData = []

            for (const post of posts) {
                const voteData = await getVotes(post._id)
                const { threaded, totalCount } = await getAllCommentsByPostId(post._id);

                postWithData.push({
                    ...post.toObject(),
                    voteData,
                    comments: threaded,
                    totalComments: totalCount,
                })
            }

            // res.status(200).json(posts)

            res.render('pages/home', {
                title: 'FoodForum - Home',
                user: req.user || null,
                posts: postWithData,
            });
        } catch (e) {
            console.error('Error rendering home page:', e.message);
            res.status(500).send('Error loading Home Page');
        }
    },

    getPostById: async (req, res) => {
        try {
            const post = await postService.getPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }
            res.status(200).json(post);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updatePost: async (req, res) => {
        try {
            const postData = req.body;
            if (req.file) {
                postData.image = req.file.path;
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
};
module.exports = postController;
// const { createPost } = require('../services/post')

// const create = async (req, res) => {
//     try {
//         console.log(req.body)
//         const post = await createPost(req.body)
//         if (post) {
//             res.status(201).json({
//                 message: 'Create Post successfully',
//                 post
//             })
//         }
//     } catch (e) {
//         res.status(400).json({ error: error.message });
//     }
// }

// module.exports = {create}