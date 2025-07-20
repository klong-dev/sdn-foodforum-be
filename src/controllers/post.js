const postService = require('../services/postService.js');

const postController = {
    createPost: async (req, res) => {
        try {
            const userId = req.user.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const postData = req.body;
            
            // Xử lý ảnh: ưu tiên file upload, nếu không có thì lấy từ body (Cloudinary links)
            if (req.file) {
                postData.image = [req.file.path];
            } else if (req.body.image) {
                // Cho phép nhận link ảnh từ Cloudinary từ frontend (có thể là string hoặc array)
                postData.image = Array.isArray(req.body.image) ? req.body.image : [req.body.image];
            } else {
                postData.image = [];
            }
            
            // Đảm bảo các trường mới được nhận từ body
            postData.tags = req.body.tags || [];
            postData.ingredients = req.body.ingredients || [];
            postData.instructions = req.body.instructions || '';
            
            const newPost = await postService.createPost(userId, postData);
            res.status(201).json(newPost);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getPosts: async (req, res) => {
        try {
            // Hỗ trợ filter theo tag, tìm kiếm theo tiêu đề, phân trang
            const { tag, search, page = 1, limit = 10 } = req.query;
            const posts = await postService.getAllPosts({ tag, search, page, limit });
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
            await postService.increaseView(req.params.id); // Tăng views
            res.status(200).json(post);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updatePost: async (req, res) => {
        try {
            const postData = req.body;
            
            // Xử lý ảnh: ưu tiên file upload, nếu không có thì lấy từ body (Cloudinary links)
            if (req.file) {
                postData.image = [req.file.path];
            } else if (req.body.image) {
                // Cho phép nhận link ảnh từ Cloudinary từ frontend (có thể là string hoặc array)
                postData.image = Array.isArray(req.body.image) ? req.body.image : [req.body.image];
            } else {
                postData.image = [];
            }
            
            postData.tags = req.body.tags || [];
            postData.ingredients = req.body.ingredients || [];
            postData.instructions = req.body.instructions || '';
            
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

    getPostsByTag: async (req, res) => {
        try {
            const tag = req.params.tag;
            const posts = await postService.getPostsByTag(tag);
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
};
module.exports = postController;