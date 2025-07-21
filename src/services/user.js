const User = require('../models/users.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { setAsync, getAsync, delAsync, expireAsync } = require('../config/redis.config');
const Post = require('../models/posts.model');

exports.createUser = async (data) => {
    const userData = { ...data };

    return await new User(userData).save();
};

exports.authenticateUser = async (email, password) => {
    console.log('authenticateUser called with:', { email, password });
    const user = await User.findOne({ email });
    console.log('User found in DB:', user);
    if (!user) throw new Error('User not found');
    console.log('Comparing password:', password, 'with hash:', user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) throw new Error('Invalid credentials');
    const role = user.role || 'user';
    const accessToken = jwt.sign(
        {
            id: user._id,
            role: role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    const refreshToken = uuidv4();
    const redisKey = `refresh_token:${refreshToken}`;

    return {
        accessToken,
        refreshToken,
        user
    };
};


exports.refreshAccessToken = async (refreshToken) => {
    const userId = await getAsync(`refresh_token:${refreshToken}`);
    if (!userId) throw new Error('Invalid refresh token');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const role = user.role || 'user';

    const accessToken = jwt.sign(
        {
            id: user._id,
            role: role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    return { accessToken, user };
};

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

exports.updateUser = async (id, data) => {
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    }
    return await User.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

// Fetch all posts by the current user
exports.getCurrentUserPosts = async (userId) => {
    return await Post.find({ author: userId });
};
