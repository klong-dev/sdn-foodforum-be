const User = require('../models/users.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { setAsync, getAsync, delAsync, expireAsync } = require('../config/redis.config');

exports.createUser = async (data) => {
    const existing = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
    if (existing) throw new Error('Username or email already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userData = { ...data, password: hashedPassword };

    return await new User(userData).save();
};

exports.authenticateUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');
    const role = user.role || 'user'; 
    const accessToken = jwt.sign(
        {
            id: user._id,
            role: role
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = uuidv4();

    // Store refresh token in Redis with user ID as value
    const redisKey = `refresh_token:${refreshToken}`;
    await setAsync(redisKey, user._id.toString(), 604800); // 7 days expiry

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
        { expiresIn: '15m' }
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
    // If password is being updated, hash it
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    }
    return await User.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};
