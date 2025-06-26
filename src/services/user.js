const User = require('../models/users.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { setAsync, getAsync, delAsync, expireAsync } = require('../config/redis.config');

const { body, validationResult } = require('express-validator');

exports.createUser = [

    body('email').isEmail().withMessage('Invalid email'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const existing = await User.findOne({ $or: [{ email: req.body.email }, { username: req.body.username }] });
            if (existing) throw new Error('Username or email already exists');

            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const userData = { ...req.body, password: hashedPassword };

            const user = await new User(userData).save();
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
];

exports.authenticateUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const role = user.role || 'user';

    // Generate access token
    const accessToken = jwt.sign(
        { id: user._id, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Store refresh token in Redis
    await setAsync(`refresh_token:${refreshToken}`, user._id.toString());
    await expireAsync(`refresh_token:${refreshToken}`, 604800); // 7 days in seconds

    return { accessToken, refreshToken, user };
};


exports.refreshAccessToken = async (refreshToken) => {
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const userId = await getAsync(`refresh_token:${refreshToken}`);
        if (!userId || userId !== decoded.id) throw new Error('Invalid refresh token');

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const role = user.role || 'user';

        // Generate new access token
        const accessToken = jwt.sign(
            { id: user._id, role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        // Rotate refresh token
        const newRefreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );

        // Replace old refresh token in Redis
        await delAsync(`refresh_token:${refreshToken}`);
        await setAsync(`refresh_token:${newRefreshToken}`, user._id.toString());
        await expireAsync(`refresh_token:${newRefreshToken}`, 604800);

        return { accessToken, refreshToken: newRefreshToken, user };
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

exports.logout = async (refreshToken) => {
    try {
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        await delAsync(`refresh_token:${refreshToken}`);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
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
