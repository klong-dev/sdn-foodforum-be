const userService = require('../services/user');

exports.getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const currentUser = await userService.getUserById(req.params.id);
        if (!currentUser) return res.status(404).json({ error: 'User not found' });
        const userData = { ...currentUser.toObject(), ...req.body };
        const updatedUser = await userService.updateUser(req.params.id, userData);
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await userService.deleteUser(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        // Log user ID from the token
        console.log('User ID from token:', req.user.id);

        const user = await userService.getUserById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Log entire user object to debug
        console.log('User from database:', JSON.stringify(user, null, 2));

        // Return all user fields except password
        const userProfile = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            phone_number: user.phone_number,
            role: user.role,
            bio: user.bio,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json(userProfile);
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const avatarPath = `/uploads/${req.file.filename}`;
        const updatedUser = await userService.updateUser(req.user.id, { avatar: avatarPath });
        res.json({ message: 'Avatar updated successfully', avatar: avatarPath, user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};