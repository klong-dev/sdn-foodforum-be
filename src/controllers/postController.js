const mongoose = require('mongoose');
const Post = require('../models/posts');
const Category = require('../models/category');
const User = require('../models/users.model');
const { ensureUniqueSlug } = require('../utils/slugify');
const { normalizeForSearch } = require('../utils/accentProcessor');
const Comment = require('../models/comment'); // Added import for Comment
const Vote = require('../models/vote');

exports.createPost = async (req, res) => {
    try {
        // Parse ingredients/instructions nếu là string (form-data)
        let { ingredients, instructions } = req.body;
        if (typeof ingredients === 'string') {
            try { ingredients = JSON.parse(ingredients); } catch { return res.status(400).json({ message: 'Invalid ingredients format' }); }
        }
        if (typeof instructions === 'string') {
            try { instructions = JSON.parse(instructions); } catch { return res.status(400).json({ message: 'Invalid instructions format' }); }
        }

        console.log(typeof ingredients);
        console.log(typeof instructions);

        // Dữ liệu đã được validate và chuẩn hóa bởi middleware
        const {
            title,
            description,
            thumbnailUrl,
            author,
            prepTimeMinutes,
            cookTimeMinutes,
            servings,
            notes,
            categories
        } = req.body;

        // 1. Tạo slug duy nhất từ title
        const slug = await ensureUniqueSlug(title);

        // 2. Chuẩn hóa các trường không dấu, lowercase
        const title_normalized = normalizeForSearch(title);
        const description_normalized = normalizeForSearch(description);
        const normalizedIngredients = ingredients.map(ing => ({
            ...ing,
            name_normalized: normalizeForSearch(ing.name)
        }));
        const normalizedInstructions = instructions.map(ins => ({
            ...ins,
            stepDescription_normalized: normalizeForSearch(ins.stepDescription)
        }));

        const newPost = new Post({
            title,
            title_normalized,
            description,
            description_normalized,
            thumbnailUrl,
            author,
            prepTimeMinutes,
            cookTimeMinutes,
            servings,
            ingredients: normalizedIngredients,
            instructions: normalizedInstructions,
            notes: notes ? notes.trim() : '',
            notes_normalized: notes ? normalizeForSearch(notes) : '',
            categories,
            slug
        });


        await newPost.save();
        return res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        // console.log(error);
        return res.status(500).json({ message: 'Failed to create post', error: error.message });
    }
};

exports.getPostBySlug = async (req, res) => {
    try {
        const post = await Post.findOne({ slug: req.params.slug })
            .populate('author', '-password')
            .populate('categories');
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Logic tránh tăng viewsCount nếu cùng user xem lại trong thời gian ngắn
        const currentTime = new Date();
        const fiveMinutesAgo = new Date(currentTime.getTime() - 5 * 60 * 1000); // 5 phút trước

        // Kiểm tra xem user này đã xem post này trong 5 phút gần đây chưa
        const recentView = await Post.findOne({
            _id: post._id,
            'recentViews.user': req.user?.id || req.ip, // Dùng user ID nếu đã login, hoặc IP nếu chưa login
            'recentViews.viewedAt': { $gte: fiveMinutesAgo }
        });

        // Chỉ tăng viewsCount nếu user chưa xem trong 5 phút gần đây
        if (!recentView) {
            await Post.findByIdAndUpdate(post._id, {
                $inc: { viewsCount: 1 },
                $push: {
                    recentViews: {
                        user: req.user?.id || req.ip,
                        viewedAt: currentTime
                    }
                }
            });
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get post', error: error.message });
    }
};

exports.getAllPosts = async (req, res) => {
    try {
        // Parse query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        console.log(req.query);

        // Build query
        let query = { 'deleted.isDeleted': { $ne: true } };

        // Search - Full-text search trên các trường normalized
        if (req.query.search) {
            const searchTerm = normalizeForSearch(req.query.search);
            query.$or = [
                { title_normalized: { $regex: searchTerm, $options: 'i' } },
                { description_normalized: { $regex: searchTerm, $options: 'i' } },
                { 'ingredients.name_normalized': { $regex: searchTerm, $options: 'i' } },
                { 'instructions.stepDescription_normalized': { $regex: searchTerm, $options: 'i' } },
                { notes_normalized: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Filter by categories (slugs or ids)
        let categoryIds = [];
        if (req.query.categorySlugs) {
            const slugs = req.query.categorySlugs.split(',');
            const categories = await Category.find({ slug: { $in: slugs } }, '_id');
            categoryIds = categories.map(cat => cat._id.toString());
        }

        if (categoryIds.length > 0) {
            // Chỉ convert các id hợp lệ
            const objectCategoryIds = categoryIds
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
            if (objectCategoryIds.length > 0) {
                query.categories = { $in: objectCategoryIds };
            } else {
                // Không có category hợp lệ, trả về empty result luôn
                return res.json({
                    posts: [],
                    pagination: {
                        currentPage: page,
                        totalPages: 0,
                        totalPosts: 0,
                        hasNextPage: false,
                        hasPrevPage: false,
                        limit
                    }
                });
            }
        } else if (req.query.categories) {
            const ids = req.query.categories.split(',');
            const objectCategoryIds = ids
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
            query.categories = { $in: objectCategoryIds };
        }

        // Filter by total time (prepTime + cookTime)
        if (req.query.maxTotalTime) {
            const maxTotalTime = parseInt(req.query.maxTotalTime);
            query.$expr = {
                $lte: [
                    { $add: ['$prepTimeMinutes', '$cookTimeMinutes'] },
                    maxTotalTime
                ]
            };
        }

        // Filter by authorUsername hoặc author id
        if (req.query.authorUsername) {
            // Tìm user theo username
            const user = await User.findOne({ username: req.query.authorUsername }, '_id');
            if (user) {
                query.author = user._id;
                console.log('query: ', query)
                console.log('user: ', user)
            } else {
                // Không tìm thấy user, trả về empty result luôn
                return res.json({
                    posts: [],
                    pagination: {
                        currentPage: page,
                        totalPages: 0,
                        totalPosts: 0,
                        hasNextPage: false,
                        hasPrevPage: false,
                        limit
                    }
                });
            }
        } else if (req.query.author) {
            // fallback: filter theo author id nếu có
            query.author = req.query.author;
        }

        // Build sort
        let sort = {};
        switch (req.query.sort) {
            case 'oldest':
                sort.createdAt = 1;
                break;
            case 'views':
                sort.viewsCount = -1;
                break;
            case 'votes':
                sort.$expr = { $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }] };
                break;
            case 'totalTime':
                sort.$expr = { $add: ['$prepTimeMinutes', '$cookTimeMinutes'] };
                break;
            default: // newest
                sort.createdAt = -1;
        }

        // Nếu sort theo votes (upvotes lớn nhất)
        if (req.query.sort === 'votes') {
            // Dùng aggregation pipeline để sort theo số lượng upvotes
            const pipeline = [
                { $match: query },
                {
                    $addFields: {
                        upvoteCount: { $size: '$upvotes' }
                    }
                },
                { $sort: { upvoteCount: -1 } },
                { $skip: skip },
                { $limit: limit }
            ];
            // Nếu cần populate author và categories, dùng $lookup
            pipeline.push(
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'author'
                    }
                },
                { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categories',
                        foreignField: '_id',
                        as: 'categories'
                    }
                }
            );
            const posts = await Post.aggregate(pipeline);
            const totalPosts = await Post.countDocuments(query);
            const totalPages = Math.ceil(totalPosts / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return res.json({
                posts,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalPosts,
                    hasNextPage,
                    hasPrevPage,
                    limit
                }
            });
        }

        // Execute query with pagination
        const [posts, totalPosts] = await Promise.all([
            Post.find(query)
                .populate('author', '-password')
                .populate('categories')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Post.countDocuments(query)
        ]);
        
        // Đếm số lượng comment cho từng post
        const postsWithCommentsCount = await Promise.all(
            posts.map(async post => {
                const commentsCount = await Comment.countDocuments({ post: post._id });
                return { ...post, commentsCount };
            })
        );
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(totalPosts / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        // Highlight search results if search term exists
        let highlightedPosts = postsWithCommentsCount;
        if (req.query.search) {
            const searchTerm = req.query.search.toLowerCase();
            highlightedPosts = postsWithCommentsCount.map(post => {
                const highlighted = { ...post };

                // Highlight title
                if (post.title) {
                    highlighted.title = highlightText(post.title, searchTerm);
                }

                // Highlight description
                if (post.description) {
                    highlighted.description = highlightText(post.description, searchTerm);
                }

                // Highlight ingredients
                if (post.ingredients) {
                    highlighted.ingredients = post.ingredients.map(ing => ({
                        ...ing,
                        name: highlightText(ing.name, searchTerm)
                    }));
                }

                // Highlight instructions
                if (post.instructions) {
                    highlighted.instructions = post.instructions.map(ins => ({
                        ...ins,
                        stepDescription: highlightText(ins.stepDescription, searchTerm)
                    }));
                }

                return highlighted;
            });
        }
        
        // Response format
        res.json({
            posts: highlightedPosts,
            pagination: {
                currentPage: page,
                totalPages,
                totalPosts,
                hasNextPage,
                hasPrevPage,
                limit
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to get posts', error: error.message });
    }
};

exports.upvotePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        // Tìm vote hiện tại
        const existingVote = await Vote.findOne({ user_id: userId, target_id: postId, target_type: 'post' });

        if (existingVote && existingVote.vote_type === 'upvote') {
            // Nếu đã upvote, bỏ upvote (xóa vote)
            await existingVote.deleteOne();
        } else if (existingVote && existingVote.vote_type === 'downvote') {
            // Nếu đang downvote, chuyển sang upvote
            existingVote.vote_type = 'upvote';
            await existingVote.save();
        } else {
            // Chưa vote, tạo mới
            await Vote.create({
                user_id: userId,
                target_id: postId,
                target_type: 'post',
                vote_type: 'upvote'
            });
        }

        // Đếm lại số upvote/downvote
        const upvotes = await Vote.countDocuments({ target_id: postId, target_type: 'post', vote_type: 'upvote' });
        const downvotes = await Vote.countDocuments({ target_id: postId, target_type: 'post', vote_type: 'downvote' });

        res.json({ message: 'Upvote updated', upvotes, downvotes });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upvote post', error: error.message });
    }
};

exports.downvotePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        // Tìm vote hiện tại
        const existingVote = await Vote.findOne({ user_id: userId, target_id: postId, target_type: 'post' });

        if (existingVote && existingVote.vote_type === 'downvote') {
            // Nếu đã downvote, bỏ downvote (xóa vote)
            await existingVote.deleteOne();
        } else if (existingVote && existingVote.vote_type === 'upvote') {
            // Nếu đang upvote, chuyển sang downvote
            existingVote.vote_type = 'downvote';
            await existingVote.save();
        } else {
            // Chưa vote, tạo mới
            await Vote.create({
                user_id: userId,
                target_id: postId,
                target_type: 'post',
                vote_type: 'downvote'
            });
        }

        // Đếm lại số upvote/downvote
        const upvotes = await Vote.countDocuments({ target_id: postId, target_type: 'post', vote_type: 'upvote' });
        const downvotes = await Vote.countDocuments({ target_id: postId, target_type: 'post', vote_type: 'downvote' });

        res.json({ message: 'Downvote updated', upvotes, downvotes });
    } catch (error) {
        res.status(500).json({ message: 'Failed to downvote post', error: error.message });
    }
};

// Helper function to highlight search terms
function highlightText(text, searchTerm) {
    if (!text || !searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}