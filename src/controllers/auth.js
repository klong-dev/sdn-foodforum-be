const userService = require('../services/user');

exports.register = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json({
            message: 'User registered successfully',
            user: user.toJSON()
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { accessToken, refreshToken, user } = await userService.authenticateUser(email, password);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        res.json({
            message: 'Login successful',
            accessToken: accessToken
        });
    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        } else if (error.message === 'Invalid credentials') {
            return res.status(401).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

// Add refresh token endpoint
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const { accessToken } = await userService.refreshAccessToken(refreshToken);

        res.json({
            message: 'Token refreshed successfully',
            refreshToken: accessToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

// Add logout endpoint
exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await userService.logout(refreshToken);
        }

        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get current user endpoint
exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userService.getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user data without sensitive information
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            message: 'User data retrieved successfully',
            user: userData
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to retrieve user data' });
    }
};

