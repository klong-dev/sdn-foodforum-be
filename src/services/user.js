const User = require('../models/users.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
// const { setAsync, getAsync, delAsync, expireAsync } = require('../config/redis.config');

exports.createUser = async (data) => {
    const existing = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
    if (existing) throw new Error('Username or email already exists');

    // Don't hash password here - the model pre-save hook will handle it
    return await new User(data).save();
};

exports.authenticateUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    // Extract user role for token
    const role = user.role || 'user'; // Default to 'user' if role is undefined

    // Generate access token with user ID and role included (without permissions)
    const accessToken = jwt.sign(
        {
            id: user._id,
            role: role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Generate refresh token (long-lived)
    const refreshToken = uuidv4();

    // Store refresh token in Redis with user ID as value
    const redisKey = `refresh_token:${refreshToken}`;
    // await setAsync(redisKey, user._id.toString(), 604800); // 7 days expiry

    return {
        accessToken,
        refreshToken,
        user
    };
};


// Add new method for token refresh
exports.refreshAccessToken = async (refreshToken) => {
    const userId = await getAsync(`refresh_token:${refreshToken}`);
    if (!userId) throw new Error('Invalid refresh token');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Extract role for token
    const role = user.role || 'user';

    // Generate new access token with role 
    const accessToken = jwt.sign(
        {
            id: user._id,
            role: role
            // Removed permissions reference that was causing errors
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    return { accessToken, user };
};

// Add logout method to invalidate refresh token
exports.logout = async (refreshToken) => {
    await delAsync(`refresh_token:${refreshToken}`);
};

exports.getUserByEmail = async (email) => {
    return await User.findOne({ email });
};

exports.getAllUsers = async () => {
    return await User.find();
};

exports.getUserById = async (id) => {
    return await User.findById(id);
};

exports.getCurrentUserDetails = async (id) => {
    const Post = require('../models/posts.model');

    const user = await User.findById(id).select('-password');
    if (!user) return null;

    // Get user's posts count
    const userPostsCount = await Post.countDocuments({ author: id });

    // Return user data with additional details
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone_number: user.phone_number,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        postsCount: userPostsCount,
        favoritesCount: user.favoritePost ? user.favoritePost.length : 0
    };
};

exports.updateUser = async (id, data) => {
    // If password is being updated, hash it
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    }
    return await User.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

// Favorite posts functionality
exports.addToFavorites = async (userId, postId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (!user.favoritePost.includes(postId)) {
        user.favoritePost.push(postId);
        await user.save();
    }
    return user;
};

exports.removeFromFavorites = async (userId, postId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.favoritePost = user.favoritePost.filter(id => !id.equals(postId));
    await user.save();
    return user;
};

exports.getUserFavoritePosts = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'favoritePost',
            populate: [
                { path: 'author', select: 'username email' },
                { path: 'category' },
                { path: 'images' }
            ]
        });
    return user ? user.favoritePost : [];
};
